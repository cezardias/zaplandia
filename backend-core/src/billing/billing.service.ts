import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../users/entities/tenant.entity';
import { Transaction, PaymentStatus } from './entities/transaction.entity';
import { BtgService } from './btg.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        private btgService: BtgService,
        private mailService: MailService,
    ) { }

    async getTenantSubscription(tenantId: string) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant não encontrado.');
        
        // Calculate trial remaining
        const now = new Date();
        const trialRemaining = Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        // Check if all mandatory billing fields are present
        const isProfileComplete = !!(
            tenant.cnpj && 
            tenant.razaoSocial && 
            tenant.responsibleName && 
            tenant.responsibleCpf && 
            tenant.responsiblePhone && 
            tenant.responsibleEmail
        );

        return {
            planType: tenant.planType,
            status: tenant.subscriptionStatus,
            paidUntil: tenant.paidUntil,
            trialEndsAt: tenant.trialEndsAt,
            trialRemainingDays: trialRemaining,
            isExpired: (tenant.paidUntil && tenant.paidUntil < now) || (tenant.trialEndsAt < now && tenant.subscriptionStatus === 'trial'),
            isProfileComplete,
            billingInfo: {
                cnpj: tenant.cnpj,
                razaoSocial: tenant.razaoSocial,
                responsibleName: tenant.responsibleName,
                responsibleCpf: tenant.responsibleCpf,
                responsiblePhone: tenant.responsiblePhone,
                responsibleEmail: tenant.responsibleEmail,
            }
        };
    }

    async updateTenantBillingInfo(tenantId: string, data: any) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant não encontrado.');

        // Update with new billing fields
        tenant.cnpj = data.cnpj;
        tenant.razaoSocial = data.razaoSocial;
        tenant.responsibleName = data.responsibleName;
        tenant.responsibleCpf = data.responsibleCpf;
        tenant.responsiblePhone = data.responsiblePhone;
        tenant.responsibleEmail = data.responsibleEmail;

        return this.tenantRepository.save(tenant);
    }

    async initiatePayment(tenantId: string, planType: 'monthly' | 'annual', method: 'pix' | 'credit_card' | 'debit_card' | 'boleto') {
        const amount = planType === 'monthly' ? 300 : 2400;
        
        switch (method) {
            case 'pix':
                return this.btgService.createPix(tenantId, amount);
            case 'credit_card':
                return this.btgService.createCardLink(tenantId, amount, planType === 'annual' ? 12 : 1);
            case 'debit_card':
                return this.btgService.createDebitLink(tenantId, amount);
            case 'boleto':
                return this.btgService.createBoleto(tenantId, amount);
            default:
                throw new InternalServerErrorException('Método de pagamento não suportado.');
        }
    }

    async handleWebhook(btgPaymentId: string, status: string) {
        const transaction = await this.transactionRepository.findOne({ 
            where: { btgPaymentId },
            relations: ['tenant']
        });

        if (!transaction) {
            this.logger.warn(`[WEBHOOK] Transação não encontrada para ID BTG: ${btgPaymentId}`);
            return;
        }

        if (status === 'PAID' && transaction.status !== PaymentStatus.PAID) {
            transaction.status = PaymentStatus.PAID;
            await this.transactionRepository.save(transaction);

            // Update Tenant Subscription
            const tenant = transaction.tenant;
            const now = new Date();
            const currentExpire = (tenant.paidUntil && tenant.paidUntil > now) ? tenant.paidUntil : now;
            
            // Add time based on plan (Monthly = 30 days, Annual = 365 days)
            // Amount or logic can determine plan but for safety check amount
            const daysToAdd = transaction.amount > 1000 ? 365 : 30;
            const newExpiry = new Date(currentExpire);
            newExpiry.setDate(newExpiry.getDate() + daysToAdd);

            tenant.paidUntil = newExpiry;
            tenant.planType = transaction.amount > 1000 ? 'annual' : 'monthly';
            tenant.subscriptionStatus = 'active';
            await this.tenantRepository.save(tenant);

            this.logger.log(`[SUBSCRIPTION] Tenant ${tenant.id} renovado até ${newExpiry.toISOString()}`);
            
            // Disparar E-mail Premium
            try {
                // Find primary owner email
                const users = await this.tenantRepository.manager.query(`SELECT email, name FROM users WHERE "tenantId" = $1 AND role IN ('admin', 'superadmin') LIMIT 1`, [tenant.id]);
                if (users.length > 0) {
                    await this.mailService.sendPremiumReceipt(users[0].email, {
                        name: users[0].name,
                        plan: tenant.planType === 'annual' ? 'Plano Anual (12 Meses)' : 'Plano Mensal',
                        amount: `R$ ${transaction.amount}`,
                        expires: newExpiry.toLocaleDateString('pt-BR')
                    });
                }
            } catch (error) {
                this.logger.error(`[MAIL] Falha ao enviar recibo para tenant ${tenant.id}: ${error.message}`);
            }
        }
    }

    async getMonthlyRevenue() {
        // Aggregate revenue data for the chart (last 6 months)
        return this.transactionRepository.createQueryBuilder('transaction')
            .select("to_char(transaction.createdAt, 'YYYY-MM')", 'month')
            .addSelect('SUM(transaction.amount)', 'total')
            .where("transaction.status = :status", { status: PaymentStatus.PAID })
            .groupBy('month')
            .orderBy('month', 'DESC')
            .limit(6)
            .getRawMany();
    }
}
