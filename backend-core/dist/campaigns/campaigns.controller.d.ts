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
    start(req: any, id: string): Promise<any>;
    pause(req: any, id: string): Promise<any>;
    createFunnel(req: any, body: any): Promise<any>;
    getFunnels(req: any): Promise<any>;
    deleteFunnel(req: any, id: string): Promise<any>;
    updateFunnel(req: any, id: string, body: any): Promise<any>;
    findOne(req: any, id: string): Promise<any>;
    update(req: any, id: string, body: any): Promise<any>;
    updateStatus(req: any, id: string, body: {
        status: CampaignStatus;
    }): Promise<any>;
    remove(req: any, id: string): Promise<any>;
}
