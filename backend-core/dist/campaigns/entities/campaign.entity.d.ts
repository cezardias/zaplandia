import { Tenant } from '../../users/entities/tenant.entity';
import { CampaignLead } from './campaign-lead.entity';
export declare enum CampaignStatus {
    PENDING = "pending",
    RUNNING = "running",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class Campaign {
    id: string;
    name: string;
    status: CampaignStatus;
    channels: string[];
    messageTemplate: string;
    integrationId: string;
    tenant: Tenant;
    tenantId: string;
    leads: CampaignLead[];
    createdAt: Date;
    updatedAt: Date;
}
