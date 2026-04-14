import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { BillingConfig } from './entities/billing-config.entity';
import { Transaction, PaymentMethod, PaymentStatus } from './entities/transaction.entity';

@Injectable()
export class BtgService {
    private readonly logger = new Logger(BtgService.name);
    private readonly authProd = 'https://id.btgpactual.com/oauth2/token';
    private readonly authSandbox = 'https://id.sandbox.btgpactual.com/oauth2/token';
    private readonly baseProd = 'https://api.empresas.btgpactual.com';
    private readonly baseSandbox = 'https://api.sandbox.empresas.btgpactual.com';

    constructor(
        @InjectRepository(BillingConfig)
        private configRepository: Repository<BillingConfig>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
    ) { }

    async getAccessToken(): Promise<string> {
        const config = await this.configRepository.findOne({ where: {} });
        if (!config || !config.btgClientId) {
            throw new InternalServerErrorException('Configuração do BTG não encontrada.');
        }

        const fullConfig = await this.configRepository.createQueryBuilder('config')
            .addSelect('config.btgClientSecret')
            .where('config.id = :id', { id: config.id })
            .getOne();

        if (!fullConfig) throw new InternalServerErrorException('Falha ao recuperar credenciais.');

        const authUrl = fullConfig.isSandbox ? this.authSandbox : this.authProd;

        try {
            const clientId = fullConfig.btgClientId.trim();
            const clientSecret = fullConfig.btgClientSecret.trim();
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            const response = await axios.post(authUrl, 'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data.access_token;
        } catch (error) {
            this.logger.error(`Erro na autenticação BTG (${fullConfig.isSandbox ? 'SANDBOX' : 'PROD'}):`, error.response?.data || error.message);
            throw new InternalServerErrorException('Falha na autenticação com o banco.');
        }
    }

    async createPix(tenantId: string, amount: number): Promise<Transaction> {
        const config = await this.configRepository.findOne({ where: {} });
        const pixKey = config?.btgPixKey || 'chave-pix-não-configurada';
        const baseUrl = config?.isSandbox ? this.baseSandbox : this.baseProd;
        
        const token = await this.getAccessToken();
        
        try {
            const response = await axios.post(`${baseUrl}/pix/v1/cob`, {
                calendario: { expiracao: 3600 },
                valor: { original: amount.toFixed(2) },
                chave: pixKey,
                solicitacaoPagador: 'Pagamento Zaplandia',
                tags: { tenantId }
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const transaction = this.transactionRepository.create({
                tenantId,
                amount,
                method: PaymentStatus.PIX as any, // Fix type cast if needed
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
        const config = await this.configRepository.findOne({ where: {} });
        const baseUrl = config?.isSandbox ? this.baseSandbox : this.baseProd;
        const token = await this.getAccessToken();

        try {
            const response = await axios.post(`${baseUrl}/checkout/v1/payment-links`, {
                amount: Math.round(amount * 100),
                installments: installments,
                payment_methods: ['credit_card'], // Force credit only
                interestType: 'buyer',
                callbackUrl: 'https://zaplandia.com.br/api/billing/webhook',
                description: 'Assinatura Zaplandia (Crédito)',
                tags: { tenantId }
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
        const config = await this.configRepository.findOne({ where: {} });
        const baseUrl = config?.isSandbox ? this.baseSandbox : this.baseProd;
        const token = await this.getAccessToken();

        try {
            const response = await axios.post(`${baseUrl}/checkout/v1/payment-links`, {
                amount: Math.round(amount * 100),
                installments: 1, // Debit is always 1x
                payment_methods: ['debit_card'], // Force debit only
                callbackUrl: 'https://zaplandia.com.br/api/billing/webhook',
                description: 'Assinatura Zaplandia (Débito)',
                tags: { tenantId }
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
        const config = await this.configRepository.findOne({ where: {} });
        const baseUrl = config?.isSandbox ? this.baseSandbox : this.baseProd;
        const token = await this.getAccessToken();

        try {
            // Using Payment Link for Boleto as it's the safest way to handle it without address collection
            const response = await axios.post(`${baseUrl}/checkout/v1/payment-links`, {
                amount: Math.round(amount * 100),
                payment_methods: ['boleto'], // Force boleto only
                callbackUrl: 'https://zaplandia.com.br/api/billing/webhook',
                description: 'Assinatura Zaplandia (Boleto)',
                tags: { tenantId }
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
