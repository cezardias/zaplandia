import { CampaignsService } from './campaigns.service';
import { CampaignStatus } from './entities/campaign.entity';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    findAll(req: any): Promise<any>;
    create(req: any, body: any): Promise<{
        id: string;
        name: string;
        status: CampaignStatus;
        channels: string[];
        messageTemplate: string;
        createdAt: Date;
    }>;
    findOne(req: any, id: string): Promise<any>;
    updateStatus(req: any, id: string, body: {
        status: CampaignStatus;
    }): Promise<import("./entities/campaign.entity").Campaign | null>;
    remove(req: any, id: string): Promise<any>;
}
