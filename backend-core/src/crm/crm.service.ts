import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, Message } from './entities/crm.entity';
import { N8nService } from '../integrations/n8n.service';
import { IntegrationsService } from '../integrations/integrations.service';

import { EvolutionApiService } from '../integrations/evolution-api.service';

@Injectable()
export class CrmService {
    private readonly logger = new Logger(CrmService.name);
    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        private readonly n8nService: N8nService,
        private readonly integrationsService: IntegrationsService,
        private readonly evolutionApiService: EvolutionApiService,
    ) { }

    async getRecentChats(tenantId: string, role?: string) {
        const where = role === 'superadmin' ? {} : { tenantId };
        return this.contactRepository.find({
            where,
            relations: ['messages'],
            order: { updatedAt: 'DESC' },
            take: 20
        });
    }

    async findAllByTenant(tenantId: string, filters?: { stage?: string, search?: string }) {
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.tenantId = :tenantId', { tenantId });

        if (filters?.stage) {
            query.andWhere('contact.stage = :stage', { stage: filters.stage });
        }

        if (filters?.search) {
            query.andWhere('(contact.name ILIKE :search OR contact.phoneNumber ILIKE :search OR contact.externalId ILIKE :search)', { search: `%${filters.search}%` });
        }

        return query.orderBy('contact.createdAt', 'DESC').getMany();
    }

    async getMessages(contactId: string, tenantId: string) {
        return this.messageRepository.find({
            where: { contactId, tenantId },
            order: { createdAt: 'ASC' }
        });
    }

    async sendMessage(tenantId: string, contactId: string, content: string, provider: string) {
        // 1. Save to DB
        const message = this.messageRepository.create({
            tenantId,
            contactId,
            content,
            direction: 'outbound',
            provider
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
                if (contact?.externalId) {
                    // Fetch active instance for this tenant
                    const instances = await this.evolutionApiService.listInstances(tenantId);
                    // Find first connected instance or fallback to first available
                    const activeInstance = instances.find((i: any) => i.status === 'open' || i.status === 'connected') || instances[0];

                    if (activeInstance) {
                        const instanceName = activeInstance.name || activeInstance.instance?.instanceName || activeInstance.instanceName;
                        this.logger.log(`Sending WhatsApp message to ${contact.externalId} via ${instanceName}`);
                        await this.evolutionApiService.sendText(tenantId, instanceName, contact.externalId, content);
                    } else {
                        this.logger.warn(`No active WhatsApp instance found for tenant ${tenantId}`);
                    }
                }
            } catch (err: any) {
                this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
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

    async ensureContact(tenantId: string, data: { name: string, phoneNumber?: string, externalId?: string }) {
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
            if (data.name && data.name !== contact.name) {
                contact.name = data.name;
                hasParamsToUpdate = true;
            }
            if (data.phoneNumber && data.phoneNumber !== contact.phoneNumber) {
                contact.phoneNumber = data.phoneNumber;
                hasParamsToUpdate = true;
            }
            if (hasParamsToUpdate) {
                await this.contactRepository.save(contact);
            }
        }
        return contact;
    }

    async getDashboardStats(tenantId: string) {
        const contacts = await this.contactRepository.find({ where: { tenantId } });

        const total = contacts.length;
        const trabalhadlos = contacts.filter(c => c.stage !== 'NOVO' && c.stage !== 'LEAD').length;
        const naoTrabalhados = total - trabalhadlos;
        const ganhos = contacts.filter(c => c.stage === 'WON').length;
        const perdidos = contacts.filter(c => c.stage === 'LOST').length;
        const conversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0.0';

        const funnelData = [
            { name: 'Novo', value: contacts.filter(c => c.stage === 'NOVO' || c.stage === 'LEAD').length, fill: '#0088FE' },
            { name: 'Em Pesquisa', value: contacts.filter(c => c.stage === 'EM_PESQUISA').length, fill: '#00C49F' },
            { name: 'Primeiro Contato', value: contacts.filter(c => c.stage === 'PRIMEIRO_CONTATO' || c.stage === 'CONTACTED').length, fill: '#FFBB28' },
            { name: 'Follow-up', value: contacts.filter(c => c.stage === 'FOLLOW_UP').length, fill: '#FF8042' },
            { name: 'Reunião', value: contacts.filter(c => c.stage === 'REUNIAO').length, fill: '#8884d8' },
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
