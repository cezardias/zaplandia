import { Repository } from 'typeorm';
import { DailyUsage } from './entities/daily-usage.entity';
export declare class UsageService {
    private usageRepository;
    private readonly logger;
    private readonly LIMITS;
    constructor(usageRepository: Repository<DailyUsage>);
    private getTodayString;
    checkAndReserve(tenantId: string, instanceName: string, feature: string, amount: number): Promise<void>;
    getRemainingQuota(tenantId: string, instanceName: string, feature: string): Promise<number>;
    parseUsage(tenantId: string, feature: string): Promise<any>;
}
