import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Contact, Message } from './entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { N8nService } from '../integrations/n8n.service';
import { IntegrationsService } from '../integrations/integrations.service';

import { EvolutionApiService } from '../integrations/evolution-api.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CrmService {
    private readonly logger = new Logger(CrmService.name);
    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
        private readonly n8nService: N8nService,
        private readonly integrationsService: IntegrationsService,
        private readonly evolutionApiService: EvolutionApiService,
    ) { }

    async getRecentChats(tenantId: string, role?: string) {
        const where = role === 'superadmin' ? {} : { tenantId };
        const contacts = await this.contactRepository.find({
            where,
            relations: ['messages'],
            order: { updatedAt: 'DESC' },
            take: 20
        });

        // Auto-clean JIDs and resolve names from CampaignLead on the fly
        return Promise.all(contacts.map(async c => {
            const nameIsBad = !c.name || c.name.includes('@s.whatsapp.net') || c.name === 'Sistema' || c.name === 'WhatsApp User' || c.name.startsWith('Contato ') || c.name.startsWith('Novo Contato ');

            if (nameIsBad && c.externalId) {
                // Try to find a better name in leads
                // 1. Exact match first
                let lead = await this.leadRepository.findOne({
                    where: { externalId: c.externalId, campaign: { tenantId } },
                    relations: ['campaign'],
                    order: { createdAt: 'DESC' }
                });

                // 2. Suffix match (last 8 digits) if exact fails
                if (!lead && c.externalId.length >= 8) {
                    const suffix = c.externalId.slice(-8);
                    lead = await this.leadRepository.findOne({
                        where: {
                            externalId: Like(`%${suffix}`),
                            campaign: { tenantId }
                        },
                        relations: ['campaign'],
                        order: { createdAt: 'DESC' }
                    });
                }

                if (lead && lead.name) {
                    // Auto-healing: update contact record permanentely if bad name
                    this.logger.log(`Auto-healing name for contact ${c.externalId}: ${c.name} -> ${lead.name}`);
                    await this.contactRepository.update(c.id, { name: lead.name });
                    return { ...c, name: lead.name };
                }
            }

            return {
                ...c,
                name: (c.name && c.name.includes('@s.whatsapp.net')) ? (c.phoneNumber || `Contato ${c.externalId?.slice(-4) || ''}`) : (c.name || c.phoneNumber || `Contato ${c.externalId?.slice(-4) || ''}`)
            };
        }));
    }

    async findAllByTenant(tenantId: string, filters?: { stage?: string, search?: string, campaignId?: string }) {
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });

        if (filters?.stage) {
            query.andWhere('contact.stage = :stage', { stage: filters.stage });
        }

        if (filters?.campaignId && filters.campaignId !== '') {
            query.innerJoin('campaign_leads', 'cl', 'cl.externalId = contact.externalId AND cl.campaignId = :campaignId', { campaignId: filters.campaignId });
        }

        if (filters?.search) {
            query.andWhere('(contact.name ILIKE :search OR contact.phoneNumber ILIKE :search OR contact.externalId ILIKE :search)', { search: `%${filters.search}%` });
        }

        return query.orderBy('contact.createdAt', 'DESC').getMany();
    }

    async findOneByExternalId(tenantId: string, externalId: string) {
        return this.contactRepository.findOne({ where: { tenantId, externalId } });
    }

    async getMessages(contactId: string, tenantId: string) {
        return this.messageRepository.find({
            where: { contactId, tenantId },
            order: { createdAt: 'ASC' }
        });
    }

    async sendMessage(tenantId: string, contactId: string, content: string, provider: string, media?: { url: string, type: string, mimetype: string, fileName?: string }) {
        // 1. Save to DB
        const message = this.messageRepository.create({
            tenantId,
            contactId,
            content,
            direction: 'outbound',
            provider,
            mediaUrl: media?.url,
            mediaType: media?.type,
            mediaMimeType: media?.mimetype,
            mediaFileName: media?.fileName
        });

        await this.messageRepository.save(message);

        // 2. Trigger n8n Webhook for automation
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

        // 3. Call target Social API
        if (provider === 'instagram') {
            try {
                const metaConfig = await this.integrationsService.getCredential(tenantId, 'META_APP_CONFIG');
                if (metaConfig) {
                    const { pageAccessToken } = JSON.parse(metaConfig);
                    const contact = await this.contactRepository.findOne({ where: { id: contactId } });

                    if (pageAccessToken && contact?.externalId) {
                        this.logger.log(`Sending Instagram message to ${contact.externalId}`);
                        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
                            recipient: { id: contact.externalId },
                            message: { text: content }
                        });
                    }
                }
            } catch (err: any) {
                this.logger.error(`Failed to send Instagram message: ${err.response?.data?.error?.message || err.message}`);
            }
        } else if (provider === 'whatsapp') {
            try {
                const contact = await this.contactRepository.findOne({ where: { id: contactId } });

                // FIX: Prioritize phoneNumber for WhatsApp, as externalId might be a Facebook/Insta ID.
                const targetNumber = contact?.phoneNumber || contact?.externalId;

                if (targetNumber) {
                    // Fetch active instance for this tenant
                    const instances = await this.evolutionApiService.listInstances(tenantId);
                    // Find first connected instance or fallback to first available
                    const activeInstance = instances.find((i: any) => i.status === 'open' || i.status === 'connected') || instances[0];

                    if (activeInstance) {
                        const instanceName = activeInstance.name || activeInstance.instance?.instanceName || activeInstance.instanceName;

                        if (media && media.url) {
                            // MEDIA SENDING LOGIC
                            this.logger.log(`Sending WhatsApp MEDIA to ${targetNumber} via ${instanceName}`);

                            // 1. Resolve local path from URL
                            // URL format: /uploads/filename.ext -> ./uploads/filename.ext
                            const filename = media.url.split('/').pop() || 'unknown_file';
                            const filePath = path.join(process.cwd(), 'uploads', filename);

                            if (fs.existsSync(filePath)) {
                                const fileBuffer = fs.readFileSync(filePath);
                                const base64 = fileBuffer.toString('base64');

                                await this.evolutionApiService.sendMedia(tenantId, instanceName, targetNumber, {
                                    type: media.type || 'image', // default
                                    mimetype: media.mimetype || '',
                                    base64: base64,
                                    fileName: media.fileName || filename,
                                    caption: content
                                });
                            } else {
                                this.logger.error(`Media file not found at ${filePath}. Sending text only.`);
                                await this.evolutionApiService.sendText(tenantId, instanceName, targetNumber, content);
                            }
                        } else {
                            // TEXT ONLY
                            this.logger.log(`Sending WhatsApp message to ${targetNumber} via ${instanceName}`);
                            await this.evolutionApiService.sendText(tenantId, instanceName, targetNumber, content);
                        }
                    } else {
                        this.logger.warn(`No active WhatsApp instance found for tenant ${tenantId}`);
                    }
                }
            } catch (err: any) {
                this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
                // Throw error to notify frontend
                throw new Error(`Falha no envio: ${err.message}`);
            }
        }

        return message;
    }

    async seedDemoData(tenantId: string) {
        // 1. Create 3 contacts
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

            // 2. Add 2 messages per contact
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
    async updateContact(tenantId: string, contactId: string, updates: any) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        if (!contact) return null;

        await this.contactRepository.update(contactId, updates);
        return this.contactRepository.findOne({ where: { id: contactId } });
    }

    async ensureContact(tenantId: string, data: { name: string, phoneNumber?: string, externalId?: string }, options?: { forceStage?: string }) {
        const where: any[] = [];
        if (data.phoneNumber && data.phoneNumber !== '') where.push({ phoneNumber: data.phoneNumber, tenantId });
        if (data.externalId && data.externalId !== '') where.push({ externalId: data.externalId, tenantId });

        // If no identifiers, create generic or throw? For now create generic with random extId if needed but prefer skipping.
        // But if name is present, we create.
        if (where.length === 0) {
            const contact = this.contactRepository.create({
                ...data,
                tenantId,
                stage: 'NOVO',
                externalId: data.externalId || data.phoneNumber || `gen-${Date.now()}`
            });
            return this.contactRepository.save(contact);
        }

        let contact = await this.contactRepository.findOne({ where });

        if (!contact) {
            contact = this.contactRepository.create({
                ...data,
                tenantId,
                stage: 'NOVO',
                externalId: data.externalId || data.phoneNumber
            });
            await this.contactRepository.save(contact);
        } else {
            // Update existing contact fields if provided
            let hasParamsToUpdate = false;
            if (data.name && data.name !== contact.name && data.name.toLowerCase() !== 'contato') {
                contact.name = data.name;
                hasParamsToUpdate = true;
            }
            if (data.phoneNumber && data.phoneNumber !== contact.phoneNumber) {
                contact.phoneNumber = data.phoneNumber;
                hasParamsToUpdate = true;
            }
            if (options?.forceStage && contact.stage !== options.forceStage) {
                contact.stage = options.forceStage;
                hasParamsToUpdate = true;
            }
            if (hasParamsToUpdate) {
                await this.contactRepository.save(contact);
            }
        }
        return contact;
    }

    async removeAllContacts(tenantId: string) {
        this.logger.warn(`Deleting ALL contacts for tenant ${tenantId}`);
        // Manually delete related messages first to avoid FK constraints
        await this.messageRepository.delete({ tenantId });
        return this.contactRepository.delete({ tenantId });
    }

    async getDashboardStats(tenantId: string, campaignId?: string) {
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });

        if (campaignId && campaignId !== '') {
            query.innerJoin('campaign_leads', 'cl', 'cl.externalId = contact.externalId AND cl.campaignId = :campaignId', { campaignId });
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

        return {
            total,
            trabalhadlos,
            naoTrabalhados,
            ganhos,
            perdidos,
            conversao,
            funnelData
        };
    }
}
