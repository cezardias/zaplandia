import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyUsage } from './entities/daily-usage.entity';

@Injectable()
export class UsageService {
    private readonly logger = new Logger(UsageService.name);
    private readonly LIMITS = {
        'whatsapp_messages': 40 // HARD LIMIT
    };

    constructor(
        @InjectRepository(DailyUsage)
        private usageRepository: Repository<DailyUsage>,
    ) { }

    private getTodayString(): string {
        return new Date().toISOString().split('T')[0];
    }

    async checkAndReserve(tenantId: string, instanceName: string, feature: string, amount: number): Promise<void> {
        const today = this.getTodayString();
        const limit = this.LIMITS[feature] || 999999;

        let usage = await this.usageRepository.findOne({
            where: { tenantId, instanceName, day: today, feature }
        });

        if (!usage) {
            usage = this.usageRepository.create({
                tenantId,
                instanceName,
                day: today,
                feature,
                count: 0
            });
        }

        const newTotal = usage.count + amount;
        if (newTotal > limit) {
            this.logger.warn(`[LIMIT_REACHED] Instance ${instanceName} usage: ${usage.count}/${limit}. Attempted: ${amount}`);
            const remaining = Math.max(0, limit - usage.count);
            throw new BadRequestException(
                `Limite diário da instância atingido! Esta instância já enviou ${usage.count} mensagens hoje. ` +
                `Seu limite restante é de ${remaining} envios, mas você tentou enviar ${amount}. ` +
                `Tente dividir a campanha ou aguarde até amanhã.`
            );
        }

        usage.count += amount;
        await this.usageRepository.save(usage);
        this.logger.log(`[USAGE] Instance ${instanceName} reserved ${amount} ${feature}. New total: ${usage.count}/${limit}`);
    }

    async getRemainingQuota(tenantId: string, instanceName: string, feature: string): Promise<number> {
        const today = this.getTodayString();
        const limit = this.LIMITS[feature] || 999999;

        const usage = await this.usageRepository.findOne({
            where: { tenantId, instanceName, day: today, feature }
        });

        const current = usage ? usage.count : 0;
        return Math.max(0, limit - current);
    }

    async parseUsage(tenantId: string, feature: string) {
        const today = this.getTodayString();
        const usage = await this.usageRepository.findOne({
            where: { tenantId, day: today, feature }
        });
        return usage ? usage.count : 0;
    }
}
