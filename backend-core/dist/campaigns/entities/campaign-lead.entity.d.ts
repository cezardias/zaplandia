import { Campaign } from './campaign.entity';
export declare enum LeadStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed",
    INVALID = "invalid"
}
export declare class CampaignLead {
    id: string;
    name: string;
    externalId: string;
    status: LeadStatus;
    errorReason: string | null;
    campaign: Campaign;
    campaignId: string;
    sentAt: Date;
    createdAt: Date;
}
