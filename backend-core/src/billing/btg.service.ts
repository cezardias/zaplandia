import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { BillingConfig } from './entities/billing-config.entity';
import { Transaction, PaymentMethod, PaymentStatus } from './entities/transaction.entity';

@Injectable()
export class BtgService {
    private readonly logger = new Logger(BtgService.name);
    private readonly authUrl = 'https://id.btgpactual.com/oauth2/token';
    private readonly baseUrl = 'https://api.btgpactual.com'; // Adjust to sandbox if needed

    constructor(
        @InjectRepository(BillingConfig)
        private configRepository: Repository<BillingConfig>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
    ) { }

    async getAccessToken(): Promise<string> {
        const config = await this.configRepository.findOne({ where: {} });
        if (!config || !config.btgClientId) {
            throw new InternalServerErrorException('Configuração do BTG não encontrada ou incompleta.');
        }

        // Note: Secret is retrieved with select: false, so we might need a special query
        const fullConfig = await this.configRepository.createQueryBuilder('config')
            .addSelect('config.btgClientSecret')
            .where('config.id = :id', { id: config.id })
            .getOne();

        if (!fullConfig) {
            throw new InternalServerErrorException('Falha ao recuperar segredo do banco.');
        }

        try {
            const auth = Buffer.from(`${fullConfig.btgClientId}:${fullConfig.btgClientSecret}`).toString('base64');
            const response = await axios.post(this.authUrl, 'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data.access_token;
        } catch (error) {
            this.logger.error('Erro na autenticação BTG:', error.response?.data || error.message);
            throw new InternalServerErrorException('Falha na autenticação com o banco.');
        }
    }

    async createPix(tenantId: string, amount: number): Promise<Transaction> {
        const token = await this.getAccessToken();
        
        try {
            // Placeholder: Exemplo de payload baseado em padrões do BTG Developers
            // O endpoint real pode variar (ex: /pix/v1/cobv)
            const response = await axios.post(`${this.baseUrl}/pix/v1/cob`, {
                calendario: { expiração: 3600 },
                valor: { original: amount.toFixed(2) },
                chave: 'chave-pix-configurada', // Isso viria do BillingConfig no futuro
                solicitacaoPagador: 'Pagamento Zaplandia',
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const transaction = this.transactionRepository.create({
                tenantId,
                amount,
                method: PaymentMethod.PIX,
                btgPaymentId: response.data.txid,
                pixQrCode: response.data.imagemQrcode,
                pixCopyPaste: response.data.pixCopiaECola,
            });

            return this.transactionRepository.save(transaction);
        } catch (error) {
            this.logger.error('Erro ao gerar Pix BTG:', error.response?.data || error.message);
            throw new InternalServerErrorException('Erro ao gerar cobrança Pix.');
        }
    }

    async createCardLink(tenantId: string, amount: number, installments: number = 12): Promise<Transaction> {
        const token = await this.getAccessToken();

        try {
            const response = await axios.post(`${this.baseUrl}/checkout/v1/payment-links`, {
                amount: Math.round(amount * 100),
                installments: installments,
                payment_methods: ['credit_card'], // Force credit only
                interestType: 'buyer',
                callbackUrl: 'https://zaplandia.com.br/api/billing/webhook',
                description: 'Assinatura Zaplandia (Crédito)',
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const transaction = this.transactionRepository.create({
                tenantId,
                amount,
                method: PaymentMethod.CREDIT_CARD,
                installments,
                btgPaymentId: response.data.id,
                checkoutUrl: response.data.checkoutUrl,
            });

            return this.transactionRepository.save(transaction);
        } catch (error) {
            this.logger.error('Erro ao gerar Link de Cartão BTG:', error.response?.data || error.message);
            throw new InternalServerErrorException('Erro ao gerar link de pagamento.');
        }
    }

    async createDebitLink(tenantId: string, amount: number): Promise<Transaction> {
        const token = await this.getAccessToken();

        try {
            const response = await axios.post(`${this.baseUrl}/checkout/v1/payment-links`, {
                amount: Math.round(amount * 100),
                installments: 1, // Debit is always 1x
                payment_methods: ['debit_card'], // Force debit only
                callbackUrl: 'https://zaplandia.com.br/api/billing/webhook',
                description: 'Assinatura Zaplandia (Débito)',
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const transaction = this.transactionRepository.create({
                tenantId,
                amount,
                method: PaymentMethod.DEBIT_CARD,
                installments: 1,
                btgPaymentId: response.data.id,
                checkoutUrl: response.data.checkoutUrl,
            });

            return this.transactionRepository.save(transaction);
        } catch (error) {
            this.logger.error('Erro ao gerar Link de Débito BTG:', error.response?.data || error.message);
            throw new InternalServerErrorException('Erro ao gerar cobrança de débito.');
        }
    }

    async createBoleto(tenantId: string, amount: number): Promise<Transaction> {
        const token = await this.getAccessToken();

        try {
            // Using Payment Link for Boleto as it's the safest way to handle it without address collection
            const response = await axios.post(`${this.baseUrl}/checkout/v1/payment-links`, {
                amount: Math.round(amount * 100),
                payment_methods: ['boleto'], // Force boleto only
                callbackUrl: 'https://zaplandia.com.br/api/billing/webhook',
                description: 'Assinatura Zaplandia (Boleto)',
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const transaction = this.transactionRepository.create({
                tenantId,
                amount,
                method: PaymentMethod.BOLETO,
                btgPaymentId: response.data.id,
                checkoutUrl: response.data.checkoutUrl,
            });

            return this.transactionRepository.save(transaction);
        } catch (error) {
            this.logger.error('Erro ao gerar Boleto BTG:', error.response?.data || error.message);
            throw new InternalServerErrorException('Erro ao gerar boleto bancário.');
        }
    }
}
