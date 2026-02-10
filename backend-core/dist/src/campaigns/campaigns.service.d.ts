import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { ContactList } from './entities/contact-list.entity';
import { CampaignLead } from './entities/campaign-lead.entity';
import { CrmService } from '../crm/crm.service';
import { IntegrationsService } from '../integrations/integrations.service';
import type { Queue } from 'bull';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
export declare class CampaignsService {
    private campaignRepository;
    private leadRepository;
    private contactListRepository;
    private crmService;
    private integrationsService;
    private campaignQueue;
    private usageService;
    private auditService;
    private readonly logger;
    constructor(campaignRepository: Repository<Campaign>, leadRepository: Repository<CampaignLead>, contactListRepository: Repository<ContactList>, crmService: CrmService, integrationsService: IntegrationsService, campaignQueue: Queue, usageService: UsageService, auditService: AuditService);
    private resolveInstanceName;
    createContactList(tenantId: string, name: string, contacts: any[]): Promise<ContactList>;
    getContactLists(tenantId: string): Promise<ContactList[]>;
    removeContactList(id: string, tenantId: string): Promise<ContactList | undefined>;
    updateContactList(id: string, tenantId: string, data: any): Promise<ContactList | null>;
    start(id: string, tenantId: string, userId?: string): Promise<Campaign>;
    pause(id: string, tenantId: string): Promise<Campaign>;
    findAllByTenant(tenantId: string): Promise<Campaign[]>;
    private extractLeadName;
    private normalizePhoneNumber;
    private extractPhoneNumber;
    create(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        status: CampaignStatus;
        channels: string[];
        messageTemplate: string;
        createdAt: Date;
    }>;
    findOne(id: string, tenantId: string): Promise<Campaign | null>;
    updateStatus(id: string, tenantId: string, status: CampaignStatus): Promise<Campaign | null>;
    update(id: string, tenantId: string, data: any): Promise<import("typeorm").UpdateResult>;
    remove(id: string, tenantId: string): Promise<Campaign | undefined>;
    getReportStats(tenantId: string, campaignId?: string): Promise<{
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
