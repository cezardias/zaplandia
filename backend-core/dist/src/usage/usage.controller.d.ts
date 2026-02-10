import { UsageService } from './usage.service';
export declare class UsageController {
    private readonly usageService;
    private readonly logger;
    constructor(usageService: UsageService);
    resetInstanceUsage(req: any, instanceName: string): Promise<{
        message: string;
    }>;
}
