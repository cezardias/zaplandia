import { CampaignsService } from './campaigns.service';
import { CampaignStatus } from './entities/campaign.entity';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    findAll(req: any): Promise<import("./entities/campaign.entity").Campaign[]>;
    create(req: any, body: any): Promise<{
        id: string;
        name: string;
        status: CampaignStatus;
        channels: string[];
        messageTemplate: string;
        createdAt: Date;
    }>;
    start(req: any, id: string): Promise<import("./entities/campaign.entity").Campaign>;
    pause(req: any, id: string): Promise<import("./entities/campaign.entity").Campaign>;
    createFunnel(req: any, body: any): Promise<import("./entities/contact-list.entity").ContactList>;
    getFunnels(req: any): Promise<import("./entities/contact-list.entity").ContactList[]>;
    deleteFunnel(req: any, id: string): Promise<import("./entities/contact-list.entity").ContactList | undefined>;
    updateFunnel(req: any, id: string, body: any): Promise<import("./entities/contact-list.entity").ContactList | null>;
    findOne(req: any, id: string): Promise<import("./entities/campaign.entity").Campaign | null>;
    update(req: any, id: string, body: any): Promise<import("typeorm").UpdateResult>;
    updateStatus(req: any, id: string, body: {
        status: CampaignStatus;
    }): Promise<import("./entities/campaign.entity").Campaign | null>;
    remove(req: any, id: string): Promise<import("./entities/campaign.entity").Campaign | undefined>;
    getReportStats(req: any, campaignId?: string): Promise<{
        added: number;
        sent: number;
        notSent: number;
        details: {
            total: number;
            pending: number;
            sent: number;
            failed: number;
            invalid: number;
        };
    }>;
}
