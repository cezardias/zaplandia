import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

    async getRecentChats(tenantId: string, role: string, filters?: { stage?: string; campaignId?: string; search?: string; instance?: string }) {
        // If superadmin, can see all messages? No, usually scoped by tenant.
        // Assuming role check handled in Controller or Guard.

        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });

        if (filters?.stage) {
            query.andWhere('contact.stage = :stage', { stage: filters.stage });
        }

        if (filters?.instance && filters.instance !== 'all') { // Filter by Instance
            // Match both full name (tenant_uuid_zaplandia_01) and friendly name (zaplandia_01)
            query.andWhere(
                '(contact.instance = :instance OR contact.instance LIKE :instancePattern)',
                {
                    instance: filters.instance,
                    instancePattern: `%_${filters.instance}` // Matches tenant_uuid_zaplandia_01 when searching for zaplandia_01
                }
            );
        }

        if (filters?.campaignId && filters.campaignId !== '') {
            query.innerJoin('campaign_leads', 'cl', 'cl.externalId = contact.externalId AND cl.campaignId = :campaignId', { campaignId: filters.campaignId });
        }

        if (filters?.search) {
            query.andWhere('(contact.name ILIKE :search OR contact.phoneNumber ILIKE :search OR contact.externalId ILIKE :search)', { search: `%${filters.search}%` });
        }

        return query.orderBy('contact.updatedAt', 'DESC').getMany(); // Order by updatedAt to show recent chats first
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

                // DEBUG LOGGING
                this.logger.log(`WhatsApp Send Request - Contact: ${contactId}, Name: ${contact?.name}, Provider: ${contact?.provider}, Phone: ${contact?.phoneNumber}, ExtId: ${contact?.externalId}`);

                // FIX: STRICT number resolution logic
                // 1. Prefer full JID from externalId (Supports LIDs and strict JIDs)
                // If the externalId already has a suffix like @s.whatsapp.net or @lid, use it directly.
                // This ensures we reply to the EXACT same thread the user contacted us from.
                let targetNumber = (contact?.externalId && contact.externalId.includes('@')) ? contact.externalId : null;

                // 2. If no full JID, prefer explicitly saved phoneNumber
                if (!targetNumber) {
                    targetNumber = contact?.phoneNumber || null;
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

                if (targetNumber) {
                    // CRITICAL FIX: Use the contact's instance, not just the first available one!
                    // This ensures we reply from the same WhatsApp number the contact messaged
                    const instances = await this.evolutionApiService.listInstances(tenantId);

                    let activeInstance;

                    // 1. Try to find the exact instance this contact belongs to
                    if (contact?.instance) {
                        activeInstance = instances.find((i: any) => {
                            const instanceName = i.name || i.instance?.instanceName || i.instanceName;
                            // Match both full name and friendly name
                            return instanceName === contact.instance || instanceName.endsWith(`_${contact.instance}`);
                        });

                        if (activeInstance) {
                            this.logger.log(`Using contact's instance: ${contact.instance}`);
                        } else {
                            this.logger.warn(`Contact's instance '${contact.instance}' not found. Falling back to first available.`);
                        }
                    }

                    // 2. Fallback: Use first connected instance
                    if (!activeInstance) {
                        activeInstance = instances.find((i: any) => i.status === 'open' || i.status === 'connected') || instances[0];
                        this.logger.warn(`No instance found for contact. Using fallback: ${activeInstance?.name || 'none'}`);
                    }

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

                                const response = await this.evolutionApiService.sendMedia(tenantId, instanceName, targetNumber, {
                                    type: media.type || 'image', // default
                                    mimetype: media.mimetype || '',
                                    base64: base64,
                                    fileName: media.fileName || filename,
                                    caption: content
                                });

                                if (response?.key?.id) {
                                    message.wamid = response.key.id;
                                    message.status = 'SENT';
                                    await this.messageRepository.save(message);
                                    this.logger.log(`Updated Outbound WAMID: ${message.wamid}`);
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
                                this.logger.log(`Updated Outbound WAMID: ${message.wamid}`);
                            }
                        }
                    } else {
                        this.logger.warn(`No active WhatsApp instance found for tenant ${tenantId}`);
                    }
                }
            } catch (err: any) {
                this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
                // Throw error to notify frontend
                if (err instanceof BadRequestException) throw err;
                throw new BadRequestException(`Falha no envio: ${err.message}`);
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
