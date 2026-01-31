import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CrmService } from '../crm/crm.service';
import { AiService } from '../integrations/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { N8nService } from '../integrations/n8n.service';
import { Repository } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly crmService: CrmService,
        private readonly aiService: AiService,
        private readonly integrationsService: IntegrationsService,
        private readonly n8nService: N8nService,
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
    ) { }

    // Meta (Face/Insta/WhatsApp) Webhook verification
    @Get('meta')
    async verifyMeta(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
        this.logger.log('Verifying Meta Webhook...');
        // Default verify token or could fetch from DB
        const metaConfig = await this.integrationsService.getCredential('null', 'META_APP_CONFIG');
        let expectedToken = 'zaplandia_verify_token';

        try {
            if (metaConfig) {
                const parsed = JSON.parse(metaConfig);
                if (parsed.verifyToken) expectedToken = parsed.verifyToken;
            }
        } catch (e) { }

        if (mode === 'subscribe' && token === expectedToken) {
            this.logger.log('Meta Webhook Verified!');
            return challenge;
        }
        return 'Forbidden';
    }

    // Handle Meta payloads (Instagram focus)
    @Post('meta')
    @HttpCode(HttpStatus.OK)
    async handleMeta(@Body() payload: any) {
        this.logger.debug('Received Meta Payload: ' + JSON.stringify(payload));

        if (payload.object !== 'instagram') {
            this.logger.warn(`Unsupported Meta object: ${payload.object}`);
            return { status: 'skipped' };
        }

        try {
            for (const entry of payload.entry) {
                const tenantId = entry.id; // Usually the Page ID or App ID, for now mapped to a default or found via integration table

                // 1. Handle Instagram Direct Messages (Messaging)
                if (entry.messaging) {
                    for (const messaging of entry.messaging) {
                        const senderId = messaging.sender.id;
                        const recipientId = messaging.recipient.id;
                        const text = messaging.message?.text;

                        if (text) {
                            this.logger.log(`Instagram DM from ${senderId}: ${text}`);

                            // Find or create contact
                            let contact = await this.contactRepository.findOne({ where: { externalId: senderId } });
                            if (!contact) {
                                contact = this.contactRepository.create({
                                    externalId: senderId,
                                    name: `Instagram User ${senderId.slice(-4)}`,
                                    provider: 'instagram',
                                    tenant: { id: 'default-tenant' } as any // Placeholder mapping
                                });
                                await this.contactRepository.save(contact);
                            }

                            // Save message
                            const message = this.messageRepository.create({
                                contactId: contact.id,
                                content: text,
                                direction: 'inbound',
                                provider: 'instagram',
                                tenantId: 'default-tenant'
                            });
                            await this.messageRepository.save(message);

                            // Trigger n8n for AI Automation
                            await this.n8nService.triggerWebhook('default-tenant', {
                                type: 'instagram.message',
                                sender_id: senderId,
                                recipient_id: recipientId,
                                content: text,
                                contact_id: contact.id
                            });
                        }
                    }
                }

                // 2. Handle Instagram Comments / Mentions (Changes)
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments' || change.field === 'mentions') {
                            const value = change.value;
                            this.logger.log(`Instagram ${change.field}: ${value.text}`);

                            // Send to n8n for AI response logic
                            await this.n8nService.triggerWebhook('default-tenant', {
                                type: `instagram.${change.field}`,
                                from: value.from,
                                content: value.text,
                                media_id: value.media_id,
                                comment_id: value.id
                            });
                        }
                    }
                }
            }
        } catch (e) {
            this.logger.error('Error processing Instagram Webhook', e.stack);
        }

        return { status: 'received' };
    }

    // Handle EvolutionAPI payloads (WhatsApp)
    @Post('evolution')
    @HttpCode(HttpStatus.OK)
    async handleEvolution(@Body() payload: any) {
        // this.logger.debug('Received Evolution Payload: ' + JSON.stringify(payload));

        const { type, data, instance } = payload;

        // Extract tenantId from instance name (format: tenant_<uuid>_<suffix>)
        let tenantId = 'default';
        if (instance && instance.startsWith('tenant_')) {
            const parts = instance.split('_');
            if (parts.length >= 2) tenantId = parts[1];
        }

        if (type === 'MESSAGES_UPSERT') {
            const messageData = data.data;
            if (!messageData || !messageData.key || messageData.key.fromMe) return { status: 'ignored' };

            const remoteJid = messageData.key.remoteJid; // e.g., 5511999998888@s.whatsapp.net
            const pushName = messageData.pushName;

            // Extract text content
            let content = '';
            if (messageData.message?.conversation) content = messageData.message.conversation;
            else if (messageData.message?.extendedTextMessage?.text) content = messageData.message.extendedTextMessage.text;
            else if (messageData.message?.imageMessage?.caption) content = messageData.message.imageMessage.caption;

            if (!content) return { status: 'no_content' };

            this.logger.log(`WhatsApp Message from ${pushName} (${remoteJid}): ${content}`);

            // Remove @s.whatsapp.net for externalId
            const externalId = remoteJid.replace('@s.whatsapp.net', '');

            // Find or create contact
            let contact = await this.contactRepository.findOne({ where: { externalId, tenantId } });
            if (!contact) {
                contact = this.contactRepository.create({
                    externalId,
                    name: pushName || `WhatsApp User ${externalId.slice(-4)}`,
                    provider: 'whatsapp',
                    tenantId
                });
                await this.contactRepository.save(contact);
            }

            // Save message
            const message = this.messageRepository.create({
                contactId: contact.id,
                content,
                direction: 'inbound',
                provider: 'whatsapp',
                tenantId
            });
            await this.messageRepository.save(message);

            // Trigger n8n for AI Automation
            /* await this.n8nService.triggerWebhook(tenantId, {
                type: 'whatsapp.message',
                sender: remoteJid,
                content,
                contact_id: contact.id,
                name: pushName
            }); */
        }

        return { status: 'received' };
    }
}
