import { Injectable, Logger, BadRequestException, OnApplicationBootstrap, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { CommunicationService } from '../communication/communication.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Brackets, Not } from 'typeorm';
import { Contact, Message } from './entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { N8nService } from '../integrations/n8n.service';
import { IntegrationsService } from '../integrations/integrations.service';

import { EvolutionApiService } from '../integrations/evolution-api.service';
import { MetaApiService } from '../integrations/meta-api.service';
import * as fs from 'fs';
import * as path from 'path';

import { Integration, IntegrationProvider, IntegrationStatus } from '../integrations/entities/integration.entity';

@Injectable()
export class CrmService implements OnApplicationBootstrap, OnModuleInit {
    private readonly logger = new Logger(CrmService.name);
    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
        @InjectRepository(Campaign)
        private campaignRepository: Repository<Campaign>,
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        private readonly n8nService: N8nService,
        private readonly integrationsService: IntegrationsService,
        private readonly evolutionApiService: EvolutionApiService,
        private readonly metaApiService: MetaApiService,
        @Inject(forwardRef(() => CommunicationService))
        private readonly communicationService: CommunicationService,
        @InjectQueue('campaign-queue') private readonly campaignQueue: Queue,
    ) { }

    async onModuleInit() {
        this.logger.log('Iniciando sincronização de colunas do CRM...');
        try {
            const queryRunner = this.contactRepository.manager.connection.createQueryRunner();
            await queryRunner.connect();
            
            // Add aiEnabled
            await queryRunner.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN`);
            // Add n8nEnabled
            await queryRunner.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "n8nEnabled" BOOLEAN`);
            // Add assignedTeamId
            await queryRunner.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "assignedTeamId" UUID`);
            // Add assignedUserId
            await queryRunner.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "assignedUserId" UUID`);

            await queryRunner.release();
            this.logger.log('Sincronização de colunas concluída com sucesso.');

            // --- ALL CONTACTS FETCH FOR CLEANUP ---
            const allContacts = await this.contactRepository.find();
            let mergeCount = 0;

            // --- PHASE 1: SUFFIX MATCHING ---
            const contactGroups = new Map<string, Contact[]>();
            for (const c of allContacts) {
                const phone = (c.phoneNumber || c.externalId || '').split('@')[0].replace(/\D/g, '');
                if (phone.length >= 8) {
                    const suffix8 = phone.slice(-8);
                    const key = `${c.tenantId}_${suffix8}`;
                    if (!contactGroups.has(key)) contactGroups.set(key, []);
                    contactGroups.get(key)!.push(c);
                }
            }
            for (const [key, group] of contactGroups.entries()) {
                if (group.length > 1) {
                    try {
                        await this.mergeContacts(key.split('_')[0], group);
                        mergeCount++;
                    } catch (err) {}
                }
            }

            // --- PHASE 2: NAME MATCHING (For LID vs JID) ---
            // Refresh contacts since Phase 1 might have deleted some
            const remainingContacts = await this.contactRepository.find();
            const nameGroups = new Map<string, Contact[]>();
            for (const c of remainingContacts) {
                // Aggressive normalization: remove spaces and special chars
                const normName = c.name?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!normName || normName.length < 4 || normName === 'contato' || normName === 'sistema') continue;
                
                // We use a GLOBAL name key if tenantId is missing, but prefer tenant+name
                const tenantKey = c.tenantId || 'global';
                const key = `${tenantKey}_${normName}`;
                
                if (!nameGroups.has(key)) nameGroups.set(key, []);
                nameGroups.get(key)!.push(c);
            }

            for (const [key, group] of nameGroups.entries()) {
                if (group.length > 1) {
                    const tenantId = key.split('_')[0];
                    // Any mix of formats (phone, LID, etc) for the same name should be merged
                    try {
                        this.logger.log(`[NAME_MERGE] Unificando ${group.length} contatos para o nome normalizado: ${key.split('_')[1]}`);
                        await this.mergeContacts(tenantId === 'global' ? group[0].tenantId : tenantId, group);
                        mergeCount++;
                    } catch (err) {}
                }
            }

            this.logger.log(`Limpeza agressiva concluída. Total de ${mergeCount} grupos consolidados.`);

        } catch (err) {
            this.logger.error(`Erro ao sincronizar colunas: ${err.message}`);
        }
    }

    async onApplicationBootstrap() {
        this.logger.log('Checking for messages that need instance backfill...');
        // Auto-fix historical messages that are missing instance data
        try {
            await this.messageRepository.query(`
                UPDATE messages
                SET instance = c.instance
                FROM contacts c
                WHERE messages."contactId" = c.id
                AND messages.instance IS NULL
                AND c.instance IS NOT NULL
            `);
            this.logger.log('Automatic backfill of message instances completed.');
        } catch (error) {
            this.logger.error('Failed to run automatic backfill:', error);
        }
    }

    async findOneById(tenantId: string, id: string): Promise<Contact | null> {
        return this.contactRepository.findOne({ where: { id, tenantId } });
    }


    async getRecentChats(tenantId: string, user: { userId: string, role: string, teamId?: string }, filters?: { stage?: string; campaignId?: string; search?: string; instance?: string }) {
        const { userId, role, teamId } = user;
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });

        // AGENT ROLE FILTER: Only see assigned chats or team chats IF the agent is in a team
        if (role === 'agent' && teamId) {
            query.andWhere(new Brackets(qb => {
                qb.where('contact.assignedUserId = :userId', { userId })
                  .orWhere('contact.assignedTeamId = :teamId', { teamId });
            }));
        }

        if (filters?.stage) {
            query.andWhere('contact.stage = :stage', { stage: filters.stage });
        }

        // 1. Resolve instance name to Integration IDs (UUIDs)
        if (filters?.instance && filters.instance !== 'all') {
            let instanceName = filters.instance;

            // Check if it's a UUID (Integration ID) and resolve to Name
            if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(instanceName)) {
                const integration = await this.integrationsService.findOne(instanceName, tenantId);
                if (integration) {
                    instanceName = integration.credentials?.instanceName || integration.settings?.instanceName || integration.credentials?.name || instanceName;
                }
            } else {
                // Fuzzy matching for canonical name resolution
                const allIntegrations = await this.integrationsService.findAllByTenant(tenantId);
                const normalizedFilter = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                const matchedIntegration = allIntegrations.find(i => {
                    const name = i.credentials?.instanceName || i.settings?.instanceName || i.credentials?.name || '';
                    const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    // STRICT EQUALITY ONLY to avoid leaks
                    return normalizedName === normalizedFilter;
                });

                if (matchedIntegration) {
                    instanceName = matchedIntegration.credentials?.instanceName || matchedIntegration.settings?.instanceName || matchedIntegration.credentials?.name || instanceName;
                }
            }

            // Smart Inference Logic (Replicated)
            let matchingCampaignIds: string[] = [];
            const allCampaigns = await this.campaignRepository.find({ where: { tenantId } });

            for (const camp of allCampaigns) {
                if (!camp.integrationId) continue;
                if (camp.integrationId === instanceName) { matchingCampaignIds.push(camp.id); continue; }

                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(camp.integrationId)) {
                    const integration = await this.integrationsService.findOne(camp.integrationId, tenantId);
                    const resolvedName = integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name;
                    if (resolvedName) {
                        const rNorm = resolvedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        if (rNorm === iNorm) {
                            matchingCampaignIds.push(camp.id);
                        }
                    }
                } else {
                    const cNorm = camp.integrationId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    if (cNorm === iNorm) {
                        matchingCampaignIds.push(camp.id);
                    }
                }
            }

            let campaignFilter = '';
            let campaignParams = {};
            if (matchingCampaignIds.length > 0) {
                // REFACTOR: Use TypeORM SubQuery to guarantee correct column mapping
                const subQuery = this.leadRepository.createQueryBuilder('cl')
                    .select('1')
                    .where('cl.campaignId IN (:...matchCampIds)')
                    .andWhere(new Brackets(qb => {
                        qb.where('cl.externalId = contact.externalId')
                            .orWhere('cl.externalId = contact.phoneNumber');
                    }))
                    .getQuery();

                query.andWhere(new Brackets(qb => {
                    qb.where('contact.instance = :instance', { instance: instanceName })
                        .orWhere('contact.instance = :originalInstance', { originalInstance: filters.instance }) // Also match the raw slug/ID
                        .orWhere('contact.instance ILIKE :instancePattern', { instancePattern: instanceName })
                        // REFACTOR: Check Message History
                        .orWhere(`EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :originalInstance))`, { instance: instanceName, originalInstance: filters.instance })
                        .orWhere(new Brackets(qb2 => {
                            qb2.where("(contact.instance IS NULL OR contact.instance = '' OR contact.instance = 'default' OR contact.instance = 'undefined')")
                                .andWhere(`EXISTS (${subQuery})`, { matchCampIds: matchingCampaignIds });
                        }));
                }));
            } else {
                query.andWhere(
                    `(contact.instance = :instance OR contact.instance = :originalInstance OR contact.instance ILIKE :instancePattern OR EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :originalInstance)))`,
                    {
                        instance: instanceName,
                        originalInstance: filters.instance,
                        instancePattern: instanceName
                    }
                );
            }
        }

        if (filters?.campaignId && filters.campaignId !== '') {
            // Robust join: match externalId OR phoneNumber
            query.innerJoin('campaign_leads', 'cl', '(cl.externalId = contact.externalId OR cl.externalId = contact.phoneNumber) AND cl.campaignId = :campaignId', { campaignId: filters.campaignId });
        }

        // DEBUG: Log distinct instances found for this tenant to identify data issues
        const distinctInstances = await this.contactRepository.createQueryBuilder('c')
            .select('DISTINCT c.instance', 'instance')
            .where('c.tenantId = :tenantId', { tenantId })
            .getRawMany();
        this.logger.debug(`[DEBUG_INSTANCES] Tenant ${tenantId} has instances: ${JSON.stringify(distinctInstances.map(d => d.instance))}`);

        // DEBUG: Output the SQL to see what's happening
        // this.logger.debug(`[SQL] ${query.getSql()}`);
        // this.logger.debug(`[PARAMS] ${JSON.stringify(query.getParameters())}`);

        return query.orderBy('contact.updatedAt', 'DESC').getMany(); // Order by updatedAt to show recent chats first
    }

    async findAllByTenant(tenantId: string, filters?: { stage?: string, search?: string, campaignId?: string, instance?: string }) {
        this.logger.debug(`[FIND_ALL] Tenant: ${tenantId}, Filters: ${JSON.stringify(filters)}`);
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });

        if (filters?.instance && filters.instance !== 'all') {
            let instanceName = filters.instance;

            // Check if it's a UUID (Integration ID) and resolve to Name
            if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(instanceName)) {
                const integration = await this.integrationsService.findOne(instanceName, tenantId);
                if (integration) {
                    instanceName = integration.credentials?.instanceName || integration.settings?.instanceName || integration.credentials?.name || instanceName;
                }
            } else {
                // Fuzzy matching for canonical name resolution
                const allIntegrations = await this.integrationsService.findAllByTenant(tenantId);
                const normalizedFilter = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                const matchedIntegration = allIntegrations.find(i => {
                    const name = i.credentials?.instanceName || i.settings?.instanceName || i.credentials?.name || '';
                    const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    // STRICT EQUALITY ONLY to avoid leaks
                    return normalizedName === normalizedFilter;
                });

                if (matchedIntegration) {
                    instanceName = matchedIntegration.credentials?.instanceName || matchedIntegration.settings?.instanceName || matchedIntegration.credentials?.name || instanceName;
                }
            }

            // Smart Inference Logic (Replicated)
            let matchingCampaignIds: string[] = [];
            const allCampaigns = await this.campaignRepository.find({ where: { tenantId } });

            for (const camp of allCampaigns) {
                if (!camp.integrationId) continue;
                if (camp.integrationId === instanceName) { matchingCampaignIds.push(camp.id); continue; }

                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(camp.integrationId)) {
                    const integration = await this.integrationsService.findOne(camp.integrationId, tenantId);
                    const resolvedName = integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name;
                    if (resolvedName) {
                        const rNorm = resolvedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        if (rNorm === iNorm) {
                            matchingCampaignIds.push(camp.id);
                        }
                    }
                } else {
                    const cNorm = camp.integrationId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    if (cNorm === iNorm) {
                        matchingCampaignIds.push(camp.id);
                    }
                }
            }

            let campaignFilter = '';
            let campaignParams = {};
            if (filters.campaignId && filters.campaignId !== '' && filters.campaignId !== 'null' && filters.campaignId !== 'undefined') {
                query.andWhere(
                    '(contact.instance = :instance OR contact.instance ILIKE :instancePattern OR contact.instance IS NULL)',
                    {
                        instance: instanceName,
                        instancePattern: instanceName
                    }
                );
            } else {
                if (matchingCampaignIds.length > 0) {
                    // REFACTOR: Use TypeORM SubQuery
                    const subQuery = this.leadRepository.createQueryBuilder('cl')
                        .select('1')
                        .where('cl.campaignId IN (:...matchCampIds)')
                        .andWhere(new Brackets(qb => {
                            qb.where('cl.externalId = contact.externalId')
                                .orWhere('cl.externalId = contact.phoneNumber');
                        }))
                        .getQuery();

                    query.andWhere(new Brackets(qb => {
                        qb.where('contact.instance = :instance', { instance: instanceName })
                            .orWhere('contact.instance ILIKE :instancePattern', { instancePattern: instanceName })
                            // REFACTOR: Check Message History
                            .orWhere(`EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :instancePattern))`, { instance: instanceName, instancePattern: instanceName })
                            .orWhere(new Brackets(qb2 => {
                                qb2.where("(contact.instance IS NULL OR contact.instance = '' OR contact.instance = 'default' OR contact.instance = 'undefined')")
                                    .andWhere(`EXISTS (${subQuery})`, { matchCampIds: matchingCampaignIds });
                            }));
                    }));
                } else {
                    query.andWhere(
                        `(contact.instance = :instance OR contact.instance ILIKE :instancePattern OR EXISTS (SELECT 1 FROM messages m WHERE m."contactId" = contact.id AND (m.instance = :instance OR m.instance = :instancePattern)))`,
                        {
                            instance: instanceName,
                            instancePattern: instanceName
                        }
                    );
                }

            }
        }

        if (filters?.stage) {
            query.andWhere('contact.stage = :stage', { stage: filters.stage });
        }

        if (filters?.campaignId && filters.campaignId !== '' && filters.campaignId !== 'null' && filters.campaignId !== 'undefined') {
            this.logger.debug(`[CAMPAIGN_FILTER] Filtering by campaignId: ${filters.campaignId}`);
            // LEFT JOIN to match contacts with campaign leads
            query.leftJoin('campaign_leads', 'cl', '(cl.externalId = contact.externalId OR cl.externalId = contact.phoneNumber) AND cl.campaignId = :campaignId', { campaignId: filters.campaignId })
                .andWhere('cl.id IS NOT NULL'); // Only include contacts that have matching campaign leads
        }

        if (filters?.search) {
            query.andWhere('(contact.name ILIKE :search OR contact.phoneNumber ILIKE :search OR contact.externalId ILIKE :search)', { search: `%${filters.search}%` });
        }

        return query.orderBy('contact.createdAt', 'DESC').getMany();
    }

    async findOneByExternalId(tenantId: string, externalId: string): Promise<Contact | null> {
        // 1. Clean the input ID (numbers only)
        const cleanId = externalId.replace(/\D/g, '');
        if (!cleanId) return null;

        // 2. Exact match attempt
        let contact = await this.contactRepository.findOne({
            where: [
                { tenantId, externalId: cleanId },
                { tenantId, phoneNumber: cleanId },
                { tenantId, externalId: Like(`%${cleanId}%`) } // Loose check
            ]
        });

        if (contact) return contact;

        // 3. Fuzzy Logic for 9th digit (Brasilian format)
        // If length is 12 or 13, try to match suffixes (last 8 digits)
        if (cleanId.length >= 8) {
            const suffix = cleanId.slice(-8); // Last 8 digits are usually stable
            contact = await this.contactRepository.findOne({
                where: {
                    tenantId,
                    externalId: Like(`%${suffix}%`)
                }
            });
        }

        return contact || null;
    }

    async getMessages(contactId: string, tenantId: string) {
        return this.messageRepository.find({
            where: { contactId, tenantId },
            order: { createdAt: 'ASC' }
        });
    }

    async sendMessage(tenantId: string, contactId: string, content: string, provider?: string, media?: { url: string, type: string, mimetype?: string, fileName?: string }) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        const finalProvider = provider || contact?.provider || 'whatsapp';

        // 1. Save to DB
        const message = this.messageRepository.create({
            tenantId,
            contactId,
            content,
            direction: 'outbound',
            provider: finalProvider,
            mediaUrl: media?.url,
            mediaType: media?.type,
            mediaMimeType: media?.mimetype,
            mediaFileName: media?.fileName,
            // instance: undefined // Leave undefined if not known
        });

        await this.messageRepository.save(message);

        // ✅ Emitir evento WebSocket para atualização em tempo real
        this.communicationService.emitToTenant(tenantId, 'new_message', {
            ...message,
            contact: contact ? { id: contact.id, name: contact.name } : null
        });

        // 2. Trigger n8n Webhook for automation (If not overridden by contact)
        if (contact && contact.n8nEnabled !== false) {
            await this.n8nService.triggerWebhook(tenantId, {
                type: 'message.new',
                message: {
                    id: message.id,
                    content: message.content,
                    direction: message.direction,
                    provider: message.provider,
                    contactId: message.contactId
                }
            });
        }

        // 3. Call target Social API
        if (finalProvider === 'instagram') {
            try {
                const metaConfig = await this.integrationsService.getCredential(tenantId, 'META_APP_CONFIG');
                if (metaConfig) {
                    const { pageAccessToken } = JSON.parse(metaConfig);

                    if (pageAccessToken && contact?.externalId) {
                        this.logger.log(`[CRM_SEND] Sending Instagram message to ${contact.externalId}`);
                        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                            recipient: { id: contact.externalId },
                            message: { text: content }
                        });
                    }
                }
            } catch (err: any) {
                this.logger.error(`[CRM_SEND] Failed to send Instagram message: ${err.response?.data?.error?.message || err.message}`);
            }
        } else if (finalProvider === 'whatsapp') {
            try {
                const contact = await this.contactRepository.findOne({ where: { id: contactId } });

                // DEBUG LOGGING
                this.logger.log(`WhatsApp Send Request - Contact: ${contactId}, Name: ${contact?.name}, Provider: ${contact?.provider}, Phone: ${contact?.phoneNumber}, ExtId: ${contact?.externalId}`);

                // FIX: STRICT number resolution logic
                // 1. Prefer full JID from externalId if it's a REAL JID (@s.whatsapp.net)
                let targetNumber = (contact?.externalId && contact.externalId.includes('@s.whatsapp.net')) ? contact.externalId : null;

                // 2. If no real JID, prefer explicitly saved phoneNumber
                if (!targetNumber) {
                    targetNumber = contact?.phoneNumber || null;
                }

                // 3. If still no number, fall back to LID if available
                if (!targetNumber && contact?.externalId && contact.externalId.includes('@lid')) {
                    targetNumber = contact.externalId;
                }

                // 3. Fallback: If externalId looks like a raw number (no suffix), use it
                if (!targetNumber && contact?.provider === 'whatsapp' && contact?.externalId) {
                    // Extra safety: Facebook PSIDs are usually 15+ digits. Brazil numbers are 12-13.
                    if (contact.externalId.length < 15 && /^\d+$/.test(contact.externalId)) {
                        targetNumber = contact.externalId;
                    } else {
                        this.logger.warn(`Skipping externalId '${contact.externalId}' as it looks invalid for WhatsApp.`);
                    }
                }

                // 2.5 SMART FALLBACK: Auto-heal if duplicate exists
                if (!targetNumber && contact?.name) {
                    // Broader Search Strategy: Match FIRST WORD only
                    // This handles "Renato Porto" vs "Renato" vs "Dr. Renato"
                    const nameParts = contact.name.trim().split(' ');
                    const searchName = nameParts[0]; // Just "Renato"

                    this.logger.log(`Searching for duplicates to heal contact ${contactId} (Name: ${contact.name}). Broad Search: '${searchName}%'...`);

                    const duplicates = await this.contactRepository.find({
                        where: {
                            tenantId,
                            name: Like(`${searchName}%`)
                        }
                    });

                    this.logger.log(`Found ${duplicates.length} candidates starting with '${searchName}'`);

                    // Match must have phone > 8 chars OR be a valid WhatsApp External Id (digits only, < 15 chars)
                    const healthyContact = duplicates.find(c =>
                        c.id !== contactId && (
                            (c.phoneNumber && c.phoneNumber.length > 8) ||
                            (c.provider === 'whatsapp' && c.externalId && c.externalId.length > 8 && c.externalId.length < 15 && /^\d+$/.test(c.externalId))
                        )
                    );

                    if (healthyContact) {
                        // Use phoneNumber if available, otherwise externalId
                        const recoveredNumber = healthyContact.phoneNumber || healthyContact.externalId;
                        this.logger.log(`Auto-healing phone from duplicate ${healthyContact.id} (${healthyContact.name}): ${recoveredNumber}`);

                        targetNumber = recoveredNumber;
                        // Persist the fix
                        await this.contactRepository.update(contactId, { phoneNumber: targetNumber });
                    } else {
                        // Log candidates to help debug if still failing
                        const candidateInfo = duplicates.map(d => `${d.name} (Ph: ${d.phoneNumber}, Ext: ${d.externalId})`).join(', ');
                        this.logger.warn(`No healthy duplicate found for '${searchName}'. Candidates: ${candidateInfo}`);
                    }
                }

                // 3. Validation: If we still don't have a number, we cannot send
                if (!targetNumber) {
                    this.logger.error(`No valid WhatsApp number found for contact ${contactId}`);
                    throw new BadRequestException('Contato não possui número de WhatsApp válido vinculado (adicione um telefone ao contato).');
                }

                // 3.5 Final Formatting: Ensure WhatsApp JID suffix
                if (provider === 'whatsapp' && !targetNumber.includes('@')) {
                    // If it's a number, append @s.whatsapp.net
                    if (/^\d+$/.test(targetNumber)) {
                        targetNumber = `${targetNumber}@s.whatsapp.net`;
                    }
                }

                // 3.6 SMART LID HEAL: If target is a LID, try to resolve to real phone JID via Evolution API
                if (targetNumber.includes('@lid')) {
                    this.logger.log(`[LID_RESOLVE] Manual message target is @lid — attempting resolution for ${targetNumber}`);
                    
                    // Attempt resolution via API (most accurate)
                    const instances = await this.evolutionApiService.listInstances(tenantId);
                    const useInstance = contact?.instance || (instances.find((i: any) => i.status === 'open' || i.status === 'connected')?.name);
                    
                    if (useInstance) {
                        const resolvedJid = await this.evolutionApiService.resolveLid(tenantId, useInstance, targetNumber);
                        if (resolvedJid) {
                            this.logger.log(`[LID_RESOLVE] API Success: ${targetNumber} -> ${resolvedJid}`);
                            targetNumber = resolvedJid;
                            // Persist the resolved JID to the contact record to fix it permanently
                            await this.contactRepository.update(contactId, { externalId: resolvedJid });
                        }
                    }

                    // Fallback to local name-based healing if API fails or instance not found
                    if (targetNumber.includes('@lid') && contact?.name) {
                        const phoneDupe = await this.contactRepository.findOne({
                            where: {
                                tenantId,
                                name: contact.name,
                                externalId: Like('%@s.whatsapp.net')
                            }
                        });
                        if (phoneDupe?.externalId) {
                            this.logger.log(`[LID_HEALING] Local Match: Redirecting ${contact.name} from LID ${targetNumber} to Phone JID ${phoneDupe.externalId}`);
                            targetNumber = phoneDupe.externalId;
                        } else {
                            // Broader Search: first name match
                            const broadSearch = await this.contactRepository.findOne({
                                where: {
                                    tenantId,
                                    name: Like(`${contact.name.split(' ')[0]}%`),
                                    externalId: Like('%@s.whatsapp.net')
                                }
                            });
                            if (broadSearch?.externalId) {
                                this.logger.log(`[LID_HEALING_BROAD] Local Broad Match: Redirecting ${contact.name} to ${broadSearch.externalId}`);
                                targetNumber = broadSearch.externalId;
                            }
                        }
                    }
                }

                if (targetNumber) {
                    // --- CLEAN NUMBER FOR GLOBAL COMPATIBILITY ---
                    let cleanTarget = targetNumber.split('@')[0].replace(/\D/g, '');
                    
                    // BR Normalization: Ensure 13 digits for Meta if it has 11 (adding 55) or 12 (missing 9)
                    // Note: Meta API is picky. We mainly ensure it starts with the country code.
                    if (cleanTarget.startsWith('0')) cleanTarget = cleanTarget.substring(1);
                    if (cleanTarget.length === 11 && !cleanTarget.startsWith('55')) cleanTarget = `55${cleanTarget}`;

                    this.logger.log(`[CRM_SEND] Routing Request - Target: ${targetNumber} -> Normalized: ${cleanTarget}`);

                    // 1. SMART ROUTING: Prioritize Meta API if credentials exist
                    const metaAccessToken = await this.integrationsService.getCredential(tenantId, 'META_ACCESS_TOKEN', true);
                    const metaPhoneId = await this.integrationsService.getCredential(tenantId, 'META_PHONE_NUMBER_ID', true);

                    // CRITICAL: Meta Cloud API ONLY supports real phone numbers (max 14 digits).
                    // If target is a LID (@lid), try to resolve real phone from a Meta-sourced contact duplicate
                    const isLid = targetNumber.includes('@lid') || cleanTarget.length > 14;

                    // Attempt to resolve real phone for LID contacts via Meta contact lookup
                    let metaTargetNumber = cleanTarget;
                    if (isLid && contact) {
                        // Look for a non-LID contact with same name or that messaged via meta/whatsapp recently
                        const metaContact = await this.contactRepository.findOne({
                            where: [
                                { tenantId, name: contact.name, provider: 'whatsapp', externalId: Like('%@s.whatsapp.net') },
                                { tenantId, phone: contact.phone, provider: 'whatsapp', externalId: Not(Like('%@lid')) },
                            ]
                        });
                        if (metaContact?.phone && metaContact.phone.length <= 15) {
                            metaTargetNumber = metaContact.phone.replace(/\D/g, '');
                            this.logger.log(`[LID_RESOLVE] Resolved LID ${cleanTarget} -> real phone ${metaTargetNumber} via contact ${metaContact.id}`);
                        } else if (contact.phone && !contact.phone.includes('@lid') && contact.phone.replace(/\D/g, '').length <= 15) {
                            // phone field itself might already be clean if it was updated
                            metaTargetNumber = contact.phone.replace(/\D/g, '');
                        }
                    }

                    // Normalize Brazilian numbers for Meta
                    if (metaTargetNumber.startsWith('0')) metaTargetNumber = metaTargetNumber.substring(1);
                    if (metaTargetNumber.length === 11 && !metaTargetNumber.startsWith('55')) metaTargetNumber = `55${metaTargetNumber}`;

                    const canUseMeta = metaAccessToken && metaPhoneId && (!isLid || metaTargetNumber.length <= 15);

                    if (canUseMeta) {
                        this.logger.log(`[META_WA] Attempting Official API send to ${metaTargetNumber}${isLid ? ' (resolved from LID)' : ''}`);
                        try {
                            const response = await this.metaApiService.sendTextMessage(tenantId, metaTargetNumber, content);
                            if (response?.messages?.[0]?.id) {
                                this.logger.log(`[META_WA] SENT SUCCESS via Official API to ${metaTargetNumber}`);
                                message.wamid = response.messages[0].id;
                                message.status = 'SENT';
                                message.provider = 'whatsapp';
                                await this.messageRepository.save(message);
                                return message;
                            }
                        } catch (metaErr: any) {
                            this.logger.warn(`[META_WA] ROUTING FAILURE: ${metaErr.message}. Attempting Evolution fallback...`);
                        }
                    } else {
                        const reason = isLid ? `LID detected, could not resolve real phone (got: ${metaTargetNumber})` : 'Missing Meta Credentials';
                        this.logger.debug(`[CRM_SEND] Skipping Meta API: ${reason}`);
                    }

                    // 2. FALLBACK: Use Evolution API
                    const instances = await this.evolutionApiService.listInstances(tenantId);
                    let activeInstance;

                    if (contact?.instance) {
                        activeInstance = instances.find((i: any) => {
                            const instanceName = i.name || i.instance?.instanceName || i.instanceName;
                            return instanceName === contact.instance || instanceName.endsWith(`_${contact.instance}`);
                        });
                    }

                    if (!activeInstance) {
                        activeInstance = instances.find((i: any) => i.status === 'open' || i.status === 'connected' || i.state === 'open' || i.state === 'connected');
                    }

                    if (activeInstance) {
                        const instanceName = activeInstance.name || activeInstance.instance?.instanceName || activeInstance.instanceName;

                        if (media && media.url) {
                            // MEDIA SENDING LOGIC
                            this.logger.log(`Sending WhatsApp MEDIA to ${targetNumber} via ${instanceName}`);
                            const filename = media.url.split('/').pop() || 'unknown_file';
                            const filePath = path.join(process.cwd(), 'uploads', filename);

                            if (fs.existsSync(filePath)) {
                                const fileBuffer = fs.readFileSync(filePath);
                                const base64 = fileBuffer.toString('base64');
                                const response = await this.evolutionApiService.sendMedia(tenantId, instanceName, targetNumber, {
                                    type: media.type || 'image',
                                    mimetype: media.mimetype || '',
                                    base64: base64,
                                    fileName: media.fileName || filename,
                                    caption: content
                                });

                                if (response?.key?.id) {
                                    message.wamid = response.key.id;
                                    message.status = 'SENT';
                                    await this.messageRepository.save(message);
                                }
                            } else {
                                this.logger.error(`Media file not found at ${filePath}. Sending text only.`);
                                const response = await this.evolutionApiService.sendText(tenantId, instanceName, targetNumber, content);
                                if (response?.key?.id) {
                                    message.wamid = response.key.id;
                                    message.status = 'SENT';
                                    await this.messageRepository.save(message);
                                }
                            }
                        } else {
                            // TEXT ONLY
                            this.logger.log(`Sending WhatsApp message to ${targetNumber} via ${instanceName}`);
                            const response = await this.evolutionApiService.sendText(tenantId, instanceName, targetNumber, content);
                            if (response?.key?.id) {
                                message.wamid = response.key.id;
                                message.status = 'SENT';
                                await this.messageRepository.save(message);
                            }
                        }
                    } else {
                        this.logger.warn(`No active WhatsApp instance found for tenant ${tenantId}`);
                    }
                }
            } catch (err: any) {
                this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
                if (err instanceof BadRequestException) throw err;
                throw new BadRequestException(`Falha no envio: ${err.message}`);
            }
        }
        return message;
    }

    async ensureContact(tenantId: string, data: { name: string, phoneNumber?: string, externalId?: string, provider?: string, instance?: string, alternativeId?: string }, options?: { forceStage?: string }) {
        const provider = data.provider || 'whatsapp';
        // Clean phone should keep all digits for international support
        const cleanPhone = data.phoneNumber?.replace(/\D/g, '');

        try {
            // 1. Direct match by externalId (JID, LID or PSID)
            if (data.externalId) {
                const existing = await this.contactRepository.findOne({ where: { tenantId, externalId: data.externalId } });
                if (existing) {
                    // Smart Upgrade: If we found a LID contact but just received a real phone number/alt JID, upgrade it!
                    if (existing.externalId.includes('@lid') && (data.alternativeId || (cleanPhone && cleanPhone.length > 8))) {
                        const nextId = (data.alternativeId && !data.alternativeId.includes('@lid')) ? data.alternativeId : existing.externalId;
                        this.logger.log(`[Smart Link] Upgrading LID contact ${existing.id} (${existing.name}) with phone/alt data.`);
                        await this.contactRepository.update(existing.id, { 
                            phoneNumber: cleanPhone || existing.phoneNumber,
                            externalId: nextId 
                        });
                        return { ...existing, phoneNumber: cleanPhone || existing.phoneNumber, externalId: nextId };
                    }
                    return existing;
                }
            }

            // 2. Direct match by alternativeId
            if (data.alternativeId) {
                const altMatch = await this.contactRepository.findOne({ where: { tenantId, externalId: data.alternativeId } });
                if (altMatch) return altMatch;
            }

            // 3. Match by Phone suffix (Aggressive Consolidation - adjusted for global)
            const where: any[] = [];
            if (cleanPhone && cleanPhone.length >= 8) {
                // For Brazilian numbers, suffix matching is safe.
                // For international, we still try suffix matching but prioritize exact matches via externalId above.
                const suffix8 = cleanPhone.slice(-8);
                where.push({ phoneNumber: Like(`%${suffix8}`), tenantId });
                where.push({ externalId: Like(`%${suffix8}%`), tenantId });
            }

            // 4. Name Match Fallback - Agressive Reconciliation for LID -> Phone
            if (data.name && !['contato', 'sistema', 'lead', 'whatsapp user'].includes(data.name.toLowerCase()) && data.name.length > 3) {
                // If we are getting a REAL phone number but we might have a LID contact by name, find it!
                const nameMatches = await this.contactRepository.find({ where: { name: data.name, tenantId } });
                
                if (nameMatches.length > 0 && (cleanPhone && cleanPhone.length > 8)) {
                    const lidContact = nameMatches.find(c => c.externalId?.includes('@lid'));
                    if (lidContact) {
                        this.logger.log(`[RECONCILIATION] Found LID contact '${lidContact.name}' (${lidContact.id}). Upgrading to phone ${cleanPhone}.`);
                        await this.contactRepository.update(lidContact.id, { 
                            phoneNumber: cleanPhone,
                            externalId: data.externalId || cleanPhone 
                        });
                        return { ...lidContact, phoneNumber: cleanPhone, externalId: data.externalId || cleanPhone };
                    }
                }
                where.push({ name: data.name, tenantId });
            }

            if (where.length > 0) {
                const contacts = await this.contactRepository.find({ where });
                // If we found local matches, use the best one or merge
                if (contacts.length > 1) return await this.mergeContacts(tenantId, contacts);
                if (contacts.length === 1) return contacts[0];
            }

            // 5. Create NEW if nothing found
            this.logger.log(`[CRM] Creating NEW contact for ${data.phoneNumber || data.externalId} (${data.name})`);
            const contact = this.contactRepository.create({
                ...data,
                tenantId,
                stage: options?.forceStage || 'LEAD',
                externalId: data.externalId || data.phoneNumber || cleanPhone
            });
            return await this.contactRepository.save(contact);

        } catch (err: any) {
            this.logger.error(`Error in ensureContact: ${err.message}`);
            // Fallback create to avoid blocking the webhook flow
            return await this.contactRepository.save(this.contactRepository.create({ ...data, tenantId }));
        }
    }

    async mergeContacts(tenantId: string, contacts: Contact[]): Promise<Contact> {
        // Sort by creation date (keep oldest as primary) or by presence of info
        const sorted = contacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const primary = sorted[0];
        const duplicates = sorted.slice(1);

        this.logger.log(`[MERGE] Consolidating ${duplicates.length} duplicates into primary contact ${primary.id}`);

        for (const dup of duplicates) {
            // Move messages to primary
            await this.messageRepository.update({ contactId: dup.id }, { contactId: primary.id });
            
            // Move campaign leads
            await this.leadRepository.update({ externalId: dup.externalId }, { externalId: primary.externalId });
            
            // Prefer regular WhatsApp JIDs over LIDs for the primary record to fix delivery
            if (dup.externalId?.includes('@s.whatsapp.net') && primary.externalId?.includes('@lid')) {
                this.logger.log(`[MERGE] Swapping LID ${primary.externalId} for Phone JID ${dup.externalId} on primary`);
                primary.externalId = dup.externalId;
                if (!primary.phoneNumber) primary.phoneNumber = dup.phoneNumber || dup.externalId.split('@')[0];
            }

            // Inherit overrides (If dup is paused, primary stays paused)
            if (dup.aiEnabled === false) primary.aiEnabled = false;
            if (dup.n8nEnabled === false) primary.n8nEnabled = false;

            // Delete duplicate
            await this.contactRepository.delete(dup.id);
        }

        await this.contactRepository.save(primary);
        return primary;
    }

    async updateContact(tenantId: string, contactId: string, updates: any) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        if (!contact) return null;

        await this.contactRepository.update(contactId, updates);
        const updated = await this.contactRepository.findOne({ where: { id: contactId } });
        
        // ✅ Notificar Frontend via WebSocket
        if (updated) {
            this.communicationService.emitToTenant(tenantId, 'contact_updated', {
                contactId: updated.id,
                ...updates
            });
        }

        this.logger.log(`Updated contact ${contactId} with: ${JSON.stringify(updates)}`);
        return updated;
    }

    async seedDemoData(tenantId: string) {
        const contactsData = [
            { name: 'Ana Silva', provider: 'whatsapp', externalId: '5511999998888' },
            { name: 'Bernardo Souza', provider: 'instagram', externalId: 'inst_user_123' },
            { name: 'Clara Mendes', provider: 'facebook', externalId: 'fb_user_456' },
        ];

        for (const data of contactsData) {
            let contact = await this.contactRepository.findOne({ where: { externalId: data.externalId, tenantId } });
            if (!contact) {
                contact = this.contactRepository.create({ ...data, tenantId });
                await this.contactRepository.save(contact);
            }

            const messages = [
                { content: 'Olá, gostaria de saber mais sobre o Zaplandia!', direction: 'inbound' as const },
                { content: 'Com certeza, Ana! O Zaplandia é o melhor CRM Omnichannel.', direction: 'outbound' as const },
            ];

            for (const msgData of messages) {
                const msg = this.messageRepository.create({
                    ...msgData,
                    contactId: contact.id,
                    tenantId,
                    provider: contact.provider
                });
                await this.messageRepository.save(msg);
            }

            contact.lastMessage = messages[1].content;
            await this.contactRepository.save(contact);
        }
    }

    async removeAllContacts(tenantId: string) {
        this.logger.warn(`Deleting ALL contacts for tenant ${tenantId}`);
        // Manually delete related messages first to avoid FK constraints
        await this.messageRepository.delete({ tenantId });
        return this.contactRepository.delete({ tenantId });
    }

    /**
     * Smart Cleanup: Remove contacts that were created for a campaign but never "warmed up".
     * Conditions for deletion:
     * 1. Stage is 'NOVO' or 'LEAD'
     * 2. No message history
     * 3. Not associated with any other campaign
     */
    async cleanupOrphanedContacts(tenantId: string, campaignId: string) {
        this.logger.log(`[CLEANUP] Starting smart cleanup for campaign ${campaignId} (Tenant: ${tenantId})`);

        // To be safe and clean up everything (including leftovers from prev versions), 
        // we run the global cleanup which covers this campaign's leads and any other orphans.
        return this.cleanupGlobalOrphanedContacts(tenantId);
    }

    /**
     * Global Orphan Cleanup: Remove ANY contact that is:
     * 1. Stage is 'NOVO' or 'LEAD'
     * 2. No message history
     * 3. Not associated with ANY existing campaign lead in the tenant
     */
    async cleanupGlobalOrphanedContacts(tenantId: string) {
        this.logger.log(`[CLEANUP] Starting global pipeline cleanup for tenant ${tenantId}`);

        // 1. Get all existing leads across ALL campaigns to know who to keep
        const allActiveLeads = await this.leadRepository.createQueryBuilder('cl')
            .innerJoin('cl.campaign', 'campaign')
            .where('campaign.tenantId = :tenantId', { tenantId })
            .select('DISTINCT cl.externalId', 'externalId')
            .getRawMany();

        const activeIdsSet = new Set(allActiveLeads.map(l => l.externalId));

        // 2. Find all "cold" contacts for this tenant
        const coldContacts = await this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId })
            .andWhere('contact.stage IN (:...coldStages)', { coldStages: ['NOVO', 'LEAD'] })
            .getMany();

        if (coldContacts.length === 0) return 0;

        let deletedCount = 0;

        for (const contact of coldContacts) {
            const phone = contact.externalId || contact.phoneNumber;

            // Check if ID is in any active campaign
            if (phone && activeIdsSet.has(phone)) continue;

            // Check for message history (Safety Layer)
            const messageCount = await this.messageRepository.count({ where: { contactId: contact.id } });
            if (messageCount > 0) continue;

            // Orphaned and inactive -> Remove
            await this.contactRepository.remove(contact);
            deletedCount++;
        }

        this.logger.log(`[CLEANUP] Global pipeline cleanup complete. Removed ${deletedCount} abandoned contacts.`);
        return deletedCount;
    }

    async getCampaignLogs(tenantId: string, campaignId: string) {
        return this.leadRepository.createQueryBuilder('lead')
            .innerJoin('lead.campaign', 'campaign')
            .where('campaign.tenantId = :tenantId', { tenantId })
            .andWhere('lead.campaignId = :campaignId', { campaignId })
            .orderBy('lead.sentAt', 'DESC')
            .take(50)
            .getMany();
    }

    async getDashboardStats(tenantId: string, campaignId?: string, instance?: string) {
        this.logger.debug(`[STATS] Tenant: ${tenantId}, Campaign: ${campaignId}, Instance: ${instance}`);
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });

        // Apply Instance Filter if provided
        if (instance && instance !== 'all') {
            let instanceName = instance;
            // Check if it's a UUID (Integration ID) and resolve to Name
            if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(instanceName)) {
                const integration = await this.integrationsService.findOne(instanceName, tenantId);
                if (integration) {
                    instanceName = integration.credentials?.instanceName || integration.settings?.instanceName || integration.credentials?.name || instanceName;
                }
            } else {
                // Fuzzy matching for canonical name resolution
                const allIntegrations = await this.integrationsService.findAllByTenant(tenantId);
                const normalizedFilter = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                const matchedIntegration = allIntegrations.find(i => {
                    const name = i.credentials?.instanceName || i.settings?.instanceName || i.credentials?.name || '';
                    const normalizedName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    return normalizedName === normalizedFilter;
                });

                if (matchedIntegration) {
                    instanceName = matchedIntegration.credentials?.instanceName || matchedIntegration.settings?.instanceName || matchedIntegration.credentials?.name || instanceName;
                }
            }

            // Smart Inference Logic (Replicated)
            let matchingCampaignIds: string[] = [];
            const allCampaigns = await this.campaignRepository.find({ where: { tenantId } });

            for (const camp of allCampaigns) {
                if (!camp.integrationId) continue;
                if (camp.integrationId === instanceName) { matchingCampaignIds.push(camp.id); continue; }

                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(camp.integrationId)) {
                    const integration = await this.integrationsService.findOne(camp.integrationId, tenantId);
                    const resolvedName = integration?.credentials?.instanceName || integration?.settings?.instanceName || integration?.credentials?.name || integration?.credentials?.instance || integration?.settings?.name;
                    if (resolvedName) {
                        const rNorm = resolvedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        if (rNorm === iNorm) {
                            matchingCampaignIds.push(camp.id);
                        }
                    }
                } else {
                    const cNorm = camp.integrationId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const iNorm = instanceName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    if (cNorm === iNorm) {
                        matchingCampaignIds.push(camp.id);
                    }
                }
            }

            let campaignFilter = '';
            let campaignParams = {};
            if (matchingCampaignIds.length > 0) {
                // REFACTOR: Use TypeORM SubQuery
                const subQuery = this.leadRepository.createQueryBuilder('cl')
                    .select('1')
                    .where('cl.campaignId IN (:...matchCampIds)')
                    .andWhere(new Brackets(qb => {
                        qb.where('cl.externalId = contact.externalId')
                            .orWhere('cl.externalId = contact.phoneNumber');
                    }))
                    .getQuery();

                // Match both full name, friendly name, AND smart inferred unassigned AND Message History
                query.andWhere(new Brackets(qb => {
                    qb.where('contact.instance = :instance', { instance: instanceName })
                        .orWhere('contact.instance ILIKE :instancePattern', { instancePattern: instanceName })
                        .orWhere(`EXISTS (SELECT 1 FROM messages m WHERE m.contactId = contact.id AND (m.instance = :instance OR m.instance = :instancePattern))`, { instance: instanceName, instancePattern: instanceName })
                        .orWhere(new Brackets(qb2 => {
                            qb2.where("(contact.instance IS NULL OR contact.instance = '' OR contact.instance = 'default' OR contact.instance = 'undefined')")
                                .andWhere(`EXISTS (${subQuery})`, { matchCampIds: matchingCampaignIds });
                        }));
                }));
            } else {
                query.andWhere(
                    '(contact.instance = :instance OR contact.instance ILIKE :instancePattern OR EXISTS (SELECT 1 FROM messages m WHERE m.contactId = contact.id AND (m.instance = :instance OR m.instance = :instancePattern)) OR contact.instance IS NULL OR contact.instance = :defVal OR contact.instance = :emptyVal OR contact.instance = :undefVal)',
                    {
                        instance: instanceName,
                        instancePattern: instanceName,
                        defVal: 'default',
                        emptyVal: '',
                        undefVal: 'undefined'
                    }
                );
            }
        }

        if (campaignId && campaignId !== '') {
            // Robust join: match externalId OR phoneNumber
            query.innerJoin('campaign_leads', 'cl', '(cl.externalId = contact.externalId OR cl.externalId = contact.phoneNumber) AND cl.campaignId = :campaignId', { campaignId });
        }

        const contacts = await query.getMany();

        const total = contacts.length;
        const trabalhadlos = contacts.filter(c => c.stage !== 'NOVO' && c.stage !== 'LEAD').length;
        const naoTrabalhados = total - trabalhadlos;
        const ganhos = contacts.filter(c => c.stage === 'CONVERTIDO').length;
        const perdidos = contacts.filter(c => c.stage === 'NOT_INTERESTED').length; // Mapping Not Interested as "Lost" for stats purposes
        const conversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0.0';

        const funnelData = [
            { name: 'Novo', value: contacts.filter(c => c.stage === 'NOVO' || c.stage === 'LEAD').length, fill: '#0088FE' },
            { name: 'Contatados', value: contacts.filter(c => c.stage === 'CONTACTED').length, fill: '#00C49F' },
            { name: 'Em Negociação', value: contacts.filter(c => c.stage === 'NEGOTIATION').length, fill: '#FFBB28' },
            { name: 'Interessados', value: contacts.filter(c => c.stage === 'INTERESTED').length, fill: '#FF8042' },
            { name: 'Convertido', value: contacts.filter(c => c.stage === 'CONVERTIDO').length, fill: '#8884d8' },
        ].filter(d => d.value > 0);

        // 6. Send Chart Data (Last 24h by Hour)
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const chartQuery = this.leadRepository.createQueryBuilder('lead')
            .select("DATE_TRUNC('hour', lead.sentAt)", 'hour')
            .addSelect('COUNT(*)', 'count')
            .where('lead.status = :status', { status: 'sent' })
            .andWhere('lead.sentAt >= :yesterday', { yesterday });

        if (campaignId && campaignId !== '') {
            chartQuery.andWhere('lead.campaignId = :campaignId', { campaignId });
        }

        const rawChartData = await chartQuery
            .groupBy('hour')
            .orderBy('hour', 'ASC')
            .getRawMany();

        const sendChartData = rawChartData.map(d => ({
            hour: new Date(d.hour).getHours() + ':00',
            count: parseInt(d.count, 10)
        }));

        // 7. Next Send Time (from Queue)
        let nextSendTime: Date | null = null;
        if (campaignId && campaignId !== '') {
            const delayedJobs = await this.campaignQueue.getJobs(['delayed']);
            const campaignJobs = delayedJobs.filter(j => j.data.campaignId === campaignId);
            if (campaignJobs.length > 0) {
                // Find the earliest delay
                const earliest = campaignJobs.reduce((min, job) =>
                    (!min || (job.timestamp + (job.opts.delay || 0) < min)) ? (job.timestamp + (job.opts.delay || 0)) : min, 0);

                if (earliest > 0) {
                    nextSendTime = new Date(earliest);
                }
            }
        }

        // 8. Daily Limit & Reset Time
        let limitRemaining = 40; // Default
        const resetTime = new Date();
        resetTime.setHours(24, 0, 0, 0); // Next midnight UTC-0
        // Adjust for Brazil (UTC-3)
        const limitResetTime = new Date(resetTime.getTime() + (3 * 60 * 60 * 1000));

        if (instance && instance !== 'all') {
            const limit = 40; // Hardcoded for now based on previous context
            const usage = await this.messageRepository.createQueryBuilder('m')
                .where('m.tenantId = :tenantId', { tenantId })
                .andWhere('m.instance = :instance', { instance })
                .andWhere('m.direction = :dir', { dir: 'outbound' })
                .andWhere("m.createdAt >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC-3')")
                .getCount();

            limitRemaining = Math.max(0, limit - usage);
        }

        return {
            total,
            trabalhadlos,
            naoTrabalhados,
            ganhos,
            perdidos,
            conversao,
            funnelData,
            sendChartData,
            nextSendTime,
            limitRemaining,
            limitResetTime
        };
    }
    async finishService(tenantId: string, contactId: string) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        if (!contact) throw new BadRequestException('Contato não encontrado.');

        // Re-enable automation and clear assignment
        contact.aiEnabled = true;
        contact.n8nEnabled = true;
        contact.assignedUserId = null;
        
        await this.contactRepository.save(contact);

        // ✅ Inserir marcador de sistema para resetar a memória da IA (Lisa)
        // Isso garante que ela comece do "Menu Inicial" no próximo contato
        await this.messageRepository.save({
            contactId: contact.id,
            content: '[CONTROLE_SISTEMA]: Atendimento Humano Finalizado. Reiniciar Fluxo de IA.',
            direction: 'outbound',
            tenantId: tenantId
        });

        return contact;
    }
}
