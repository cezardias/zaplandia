import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Contact, Message } from './entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { N8nService } from '../integrations/n8n.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { EvolutionApiService } from '../integrations/evolution-api.service';
export declare class CrmService implements OnApplicationBootstrap {
    private contactRepository;
    private messageRepository;
    private leadRepository;
    private campaignRepository;
    private readonly n8nService;
    private readonly integrationsService;
    private readonly evolutionApiService;
    private readonly logger;
    constructor(contactRepository: Repository<Contact>, messageRepository: Repository<Message>, leadRepository: Repository<CampaignLead>, campaignRepository: Repository<Campaign>, n8nService: N8nService, integrationsService: IntegrationsService, evolutionApiService: EvolutionApiService);
    onApplicationBootstrap(): Promise<void>;
    getRecentChats(tenantId: string, role: string, filters?: {
        stage?: string;
        campaignId?: string;
        search?: string;
        instance?: string;
    }): Promise<Contact[]>;
    findAllByTenant(tenantId: string, filters?: {
        stage?: string;
        search?: string;
        campaignId?: string;
        instance?: string;
    }): Promise<Contact[]>;
    findOneByExternalId(tenantId: string, externalId: string): Promise<Contact | null>;
    getMessages(contactId: string, tenantId: string): Promise<Message[]>;
    sendMessage(tenantId: string, contactId: string, content: string, provider: string, media?: {
        url: string;
        type: string;
        mimetype: string;
        fileName?: string;
    }): Promise<Message>;
    seedDemoData(tenantId: string): Promise<void>;
    updateContact(tenantId: string, contactId: string, updates: any): Promise<Contact | null>;
    ensureContact(tenantId: string, data: {
        name: string;
        phoneNumber?: string;
        externalId?: string;
        instance?: string;
    }, options?: {
        forceStage?: string;
    }): Promise<Contact>;
    removeAllContacts(tenantId: string): Promise<import("typeorm").DeleteResult>;
    getDashboardStats(tenantId: string, campaignId?: string, instance?: string): Promise<{
        total: number;
        trabalhadlos: number;
        naoTrabalhados: number;
        ganhos: number;
        perdidos: number;
        conversao: string;
        funnelData: {
            name: string;
            value: number;
            fill: string;
        }[];
    }>;
}
