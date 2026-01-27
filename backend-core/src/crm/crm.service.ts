import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, Message } from './entities/crm.entity';
import { N8nService } from '../integrations/n8n.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class CrmService {
    private readonly logger = new Logger(CrmService.name);
    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        private readonly n8nService: N8nService,
        private readonly integrationsService: IntegrationsService, // Need this to fetch tokens
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

    async findAllByTenant(tenantId: string) {
        return this.contactRepository.find({
            where: { tenantId }
        });
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

        // 3. Call target Social API (Instagram focus)
        if (provider === 'instagram') {
            try {
                const metaConfig = await this.integrationsService.getCredential(tenantId, 'META_APP_CONFIG');
                if (metaConfig) {
                    const { pageAccessToken, pageId } = JSON.parse(metaConfig);
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
}
