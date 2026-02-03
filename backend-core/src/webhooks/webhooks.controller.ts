import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CrmService } from '../crm/crm.service';
import { AiService } from '../integrations/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { N8nService } from '../integrations/n8n.service';
import { Repository, Like } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
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
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
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

                            // Update Contact Stage on Reply
                            if (['NOVO', 'LEAD', 'CONTACTED', 'SENT'].includes(contact.stage || '')) {
                                await this.crmService.updateContact(tenantId, contact.id, { stage: 'NEGOTIATION' });
                            }

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
        this.logger.log('Received Evolution Payload: ' + JSON.stringify(payload));

        const { type, event, data, instance, sender } = payload;
        const eventType = (type || event || '').toUpperCase();

        // Extract tenantId using multiple strategies
        let tenantId = 'default';
        let instanceName = typeof instance === 'string' ? instance : (instance?.instanceName || instance?.name || '');

        // Strategy 1: Top-level instance field (String or Object prop)
        if (instanceName && instanceName.startsWith('tenant_')) {
            const parts = instanceName.split('_');
            // tenant_UUID_name
            if (parts.length >= 2) tenantId = parts[1];
        }
        // Strategy 2: Check sender field
        else if (sender && sender.startsWith('tenant_')) {
            instanceName = sender;
            const parts = sender.split('_');
            if (parts.length >= 2) tenantId = parts[1];
        }

        if (tenantId === 'default') {
            this.logger.error(`FAILED TO EXTRACT TENANT ID from instance: ${JSON.stringify(instance)} or sender: ${sender}. Payload: ${JSON.stringify(payload)}`);
        } else {
            this.logger.log(`Extracted tenantId: ${tenantId} from instance: ${instanceName}`);
        }

        if (eventType === 'MESSAGES_UPSERT' || eventType === 'SEND_MESSAGE' || eventType === 'MESSAGES.UPSERT' || eventType === 'SEND.MESSAGE') {
            const messageData = data.data || data; // Handle potential structure variations

            if (!messageData || !messageData.key) {
                this.logger.log(`Ignoring message: Data incomplete.`);
                return { status: 'ignored' };
            }

            const isOutbound = messageData.key.fromMe === true;
            const remoteJid = messageData.key.remoteJid; // e.g., 5511999998888@s.whatsapp.net
            const pushName = messageData.pushName || payload.sender || (isOutbound ? 'Sistema' : 'WhatsApp User');

            // Extract text content
            let content = '';
            if (messageData.message?.conversation) content = messageData.message.conversation;
            else if (messageData.message?.extendedTextMessage?.text) content = messageData.message.extendedTextMessage.text;
            else if (messageData.message?.imageMessage?.caption) content = messageData.message.imageMessage.caption;
            // Also check for send.message specific structure if different
            else if (messageData.extendedTextMessage?.text) content = messageData.extendedTextMessage.text;

            if (!content) {
                this.logger.warn(`Message from ${remoteJid} has no text content. Type: ${messageData.messageType}`);
                return { status: 'no_content' };
            }

            this.logger.log(`WhatsApp (${isOutbound ? 'OUT' : 'IN'}) from ${pushName} (${remoteJid}): ${content}`);

            // Clean remoteJid for externalId (strip @s.whatsapp.net, @lid, etc.)
            const externalId = remoteJid.split('@')[0];

            try {
                // Find or create contact
                // Find or create contact
                // FIXED: Search by externalId OR phoneNumber to preventing duplicates for manually added contacts
                // AGGRESSIVE: If no strict match, try to match by suffix (last 8 digits) to catch format differences
                let contact = await this.contactRepository.findOne({
                    where: [
                        { externalId, tenantId },
                        { phoneNumber: externalId, tenantId } // Match phone number too!
                    ]
                });

                if (!contact && externalId.length >= 8) {
                    const suffix = externalId.slice(-8); // Last 8 digits (e.g. 99998888)
                    this.logger.log(`No strict contact match. Trying fuzzy match for suffix: ${suffix}`);
                    const fuzzyMatch = await this.contactRepository.findOne({
                        where: {
                            phoneNumber: Like(`%${suffix}`),
                            tenantId
                        }
                    });

                    if (fuzzyMatch) {
                        this.logger.log(`[Smart Link] Fuzzy matched contact by Phone Suffix ${suffix} -> ${fuzzyMatch.name}. Linking.`);
                        contact = fuzzyMatch;
                        contact.externalId = externalId; // Update externalId to match incoming
                        await this.contactRepository.save(contact);
                    }
                }

                // Auto-link: If found by phone but externalId is missing, save it.
                if (contact && !contact.externalId) {
                    this.logger.log(`[Smart Link] Found contact by Phone ${externalId}. Linking externalId.`);
                    contact.externalId = externalId;
                    await this.contactRepository.save(contact);
                }

                // Resolve name - Prioritize Human Names over JIDs/Numbers/System
                let resolvedName = pushName;
                const isBadName = !resolvedName || resolvedName === 'Sistema' || resolvedName === 'WhatsApp User' || (resolvedName && resolvedName.includes('@')) || (resolvedName && /^\d+$/.test(resolvedName));

                if (isBadName) {
                    // Try exact match first
                    let lead = await this.leadRepository.findOne({
                        where: {
                            externalId,
                            campaign: { tenantId }
                        },
                        relations: ['campaign'],
                        order: { createdAt: 'DESC' }
                    });

                    // Fallback to suffix matching (last 8 digits) if exact match fails
                    if (!lead && externalId.length >= 8) {
                        const suffix = externalId.slice(-8);
                        lead = await this.leadRepository.findOne({
                            where: {
                                externalId: Like(`%${suffix}`),
                                campaign: { tenantId }
                            },
                            relations: ['campaign'],
                            order: { createdAt: 'DESC' }
                        });
                    }

                    if (lead && lead.name) resolvedName = lead.name;
                }

                if (!contact) {
                    if (isOutbound) {
                        this.logger.warn(`[Ghost Protection] Ignoring Outbound message from unknown ID ${externalId} (likely LID/Echo). Keeping CRM clean.`);
                        return { status: 'ignored_ghost' };
                    }

                    this.logger.log(`Creating new contact for ${externalId} in tenant ${tenantId}`);
                    contact = this.contactRepository.create({
                        externalId,
                        name: (resolvedName && !resolvedName.includes('@')) ? resolvedName : `Novo Contato ${externalId.slice(-4)}`,
                        provider: 'whatsapp',
                        tenantId
                    });
                    await this.contactRepository.save(contact);
                } else {
                    // "Healing" logic: overwrite if current name is a JID/system and we found a real name
                    const currentIsBad = !contact.name || contact.name.includes('@') || contact.name === contact.externalId || contact.name.startsWith('Novo Contato ') || contact.name.startsWith('Contato ');
                    const newIsBetter = resolvedName && !resolvedName.includes('@') && resolvedName !== 'Sistema' && !resolvedName.startsWith('Novo Contato ') && !resolvedName.startsWith('Contato ');

                    if (currentIsBad && newIsBetter) {
                        this.logger.log(`Updating JID/Generic name to human name: ${contact.name} -> ${resolvedName}`);
                        contact.name = resolvedName;
                        await this.contactRepository.save(contact);
                    }
                }

                // 3. IDEMPOTENCY CHECK: Ensure we don't save the same message twice
                const existingMessage = await this.messageRepository.findOne({ where: { wamid } });
                if (existingMessage) {
                    this.logger.warn(`[Deduplication] Message ${wamid} already exists. Skipping.`);
                    return { status: 'duplicate_skipped' };
                }

                // Save message
                const message = this.messageRepository.create({
                    contactId: contact.id,
                    content,
                    direction: isOutbound ? 'outbound' : 'inbound',
                    provider: 'whatsapp',
                    tenantId,
                    wamid: messageData.key.id // Save External WhatsApp ID
                });
                await this.messageRepository.save(message);
                this.logger.log(`Message saved successfully. ID: ${message.id}`);

                // Update contact meta info to show in inbox
                contact.lastMessage = content;
                contact.updatedAt = new Date(); // Explicitly touch updatedAt
                await this.contactRepository.save(contact);

                // Update Contact Stage on Reply
                if (['NOVO', 'LEAD', 'CONTACTED', 'SENT'].includes(contact.stage || '')) {
                    await this.crmService.updateContact(tenantId, contact.id, { stage: 'NEGOTIATION' });
                    this.logger.log(`Updated contact ${contact.id} stage to NEGOTIATION due to reply`);
                }

                // Trigger n8n for AI Automation
                try {
                    await this.n8nService.triggerWebhook(tenantId, {
                        type: 'whatsapp.message',
                        sender: remoteJid,
                        content,
                        contact_id: contact.id,
                        name: pushName,
                        message_id: message.id
                    });
                    this.logger.log('Triggered n8n webhook');
                } catch (n8nError) {
                    this.logger.error(`Failed to trigger n8n: ${n8nError.message}`);
                }

            } catch (err) {
                this.logger.error(`Error processing WhatsApp message: ${err.message}`, err.stack);
                throw err;
            }
        } else if (eventType === 'MESSAGES_UPDATE' || eventType === 'MESSAGES.UPDATE') {
            // ACK / READ STATUS UPDATES
            // This is critical for "Learning" LIDs. 
            // If we sent to a Phone Number but get an ACK from a LID, we link them here.

            const eventData = data.data || data;
            if (eventData && eventData.id) {
                const messageId = eventData.id;
                const remoteJid = eventData.remoteJid;
                const status = eventData.status;

                // 1. Find the message
                // 1. Find the message by WAMID (External ID) to avoid UUID errors
                const message = await this.messageRepository.findOne({ where: { wamid: messageId /*, tenantId*/ } });

                if (message) {
                    // Update Status
                    if (status) {
                        message.status = status;
                        await this.messageRepository.save(message);
                    }

                    // 2. LID LINKING MAGIC
                    if (remoteJid && message.contactId) {
                        const contact = await this.contactRepository.findOne({ where: { id: message.contactId } });
                        if (contact) {
                            // Clean the JID
                            const newExternalId = remoteJid.split('@')[0];
                            const currentExternalId = contact.externalId;

                            // If we have a NEW external ID (e.g. LID) and it's different from what we have
                            // We update externalId to the new one (LID), because that's what WA is using.
                            // CRITICAL: We DO NOT touch phoneNumber. sending uses phoneNumber priority.
                            if (newExternalId && newExternalId !== currentExternalId && !newExternalId.includes('status')) {
                                this.logger.log(`[Smart Link] Linking Contact ${contact.name} (Ph: ${contact.phoneNumber}) to new JID/LID: ${newExternalId}`);
                                contact.externalId = newExternalId;
                                await this.contactRepository.save(contact);
                            }
                        }
                    }
                }
            }
        }

        return { status: 'received' };
    }
}
