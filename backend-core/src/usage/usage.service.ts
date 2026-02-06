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

    async checkAndReserve(tenantId: string, feature: string, amount: number): Promise<void> {
        const today = this.getTodayString();
        const limit = this.LIMITS[feature] || 999999;

        let usage = await this.usageRepository.findOne({
            where: { tenantId, day: today, feature }
        });

        if (!usage) {
            usage = this.usageRepository.create({
                tenantId,
                day: today,
                feature,
                count: 0
            });
        }

        if (usage.count + amount > limit) {
            this.logger.warn(`[LIMIT_REACHED] Tenant ${tenantId} tried to use ${amount} of ${feature} but has ${usage.count}/${limit}`);
            throw new BadRequestException(`Limite diário atingido! Você já usou ${usage.count} de ${limit} envios hoje. Tente diminuir o lote ou aguarde até amanhã.`);
        }

        usage.count += amount;
        await this.usageRepository.save(usage);
        this.logger.log(`[USAGE] Tenant ${tenantId} reserved ${amount} ${feature}. New total: ${usage.count}/${limit}`);
    }

    async parseUsage(tenantId: string, feature: string) {
        const today = this.getTodayString();
        const usage = await this.usageRepository.findOne({
            where: { tenantId, day: today, feature }
        });
        return usage ? usage.count : 0;
    }
}
