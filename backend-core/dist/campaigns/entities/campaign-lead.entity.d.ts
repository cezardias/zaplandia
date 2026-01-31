import { Campaign } from './campaign.entity';
export declare enum LeadStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed"
}
export declare class CampaignLead {
    id: string;
    name: string;
    externalId: string;
    status: LeadStatus;
    errorReason: string;
    campaign: Campaign;
    campaignId: string;
    createdAt: Date;
}
