import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingConfig } from '../billing/entities/billing-config.entity';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        @InjectRepository(BillingConfig)
        private configRepository: Repository<BillingConfig>,
    ) { }

    private async getTransporter() {
        if (this.transporter) return this.transporter;

        const config = await this.configRepository.findOne({ where: {} });
        
        // Note: Password select: false
        const fullConfig = await this.configRepository.createQueryBuilder('config')
            .addSelect('config.smtpPass')
            .getOne();

        this.transporter = nodemailer.createTransport({
            host: fullConfig?.smtpHost || 'cal.zaplandia.com.br',
            port: fullConfig?.smtpPort || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: fullConfig?.smtpUser || 'financeiro@zaplandia.com.br',
                pass: fullConfig?.smtpPass || '123456',
            },
        });

        return this.transporter;
    }

    async sendPremiumReceipt(to: string, data: { name: string, plan: string, amount: string, expires: string }) {
        const transporter = await this.getTransporter();

        const html = `
            <div style="background-color: #0d1117; color: #ffffff; font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 40px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #0081ff; font-weight: 800; letter-spacing: -1px; margin: 0;">ZAPLÂNDIA</h1>
                    <p style="color: #8b949e; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Pagamento Confirmado</p>
                </div>
                
                <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                    <h2 style="margin-top: 0; font-size: 20px;">Olá, ${data.name}! 🚀</h2>
                    <p style="color: #c9d1d9; line-height: 1.6;">
                        Seu pagamento para o plano <strong>${data.plan}</strong> foi processado com sucesso. Sua conta Zaplandia já está com todas as funcionalidades liberadas.
                    </p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 10px 0; color: #8b949e; border-bottom: 1px solid #30363d;">Valor:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #30363d;">${data.amount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #8b949e; border-bottom: 1px solid #30363d;">Válido até:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #3fb950; border-bottom: 1px solid #30363d;">${data.expires}</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center;">
                    <a href="https://app.zaplandia.com.br/dashboard" 
                       style="background-color: #0081ff; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                       Acessar meu Dashboard
                    </a>
                </div>

                <div style="text-align: center; margin-top: 40px; border-top: 1px solid #30363d; pt: 20px;">
                    <p style="color: #484f58; font-size: 11px;">Este e-mail foi enviado automaticamente pela plataforma Zaplandia.</p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: '"Zaplandia Financeiro" <financeiro@zaplandia.com.br>',
                to: to,
                bcc: 'financeiro@zaplandia.com.br',
                subject: '🔥 Assinatura Confirmada - Zaplandia',
                html: html,
            });
            this.logger.log(`[MAIL] E-mail de confirmação enviado para ${to}`);
        } catch (error) {
            this.logger.error(`[MAIL] Erro ao enviar e-mail: ${error.message}`);
        }
    }
}
