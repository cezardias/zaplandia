import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CrmService } from '../crm/crm.service';
import { AiService } from '../ai/ai.service';
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

            // Clean remoteJid for externalId (strip device suffixes like :7 but keep @s.whatsapp.net or @lid)
            const externalId = remoteJid.replace(/:[0-9]+/, '');
            const phonePart = externalId.split('@')[0];
            this.logger.debug(`[JID] remoteJid: ${remoteJid} -> externalId: ${externalId} (Phone: ${phonePart})`);

            try {
                // STEP 1: Try exact match by externalId (JID) or phoneNumber
                let contact = await this.contactRepository.findOne({
                    where: [
                        { externalId, tenantId },
                        { phoneNumber: phonePart, tenantId }
                    ]
                });

                // STEP 2: If no exact match, try fuzzy match by suffix (last 10 digits of the PHONE part)
                // Using 10 digits instead of 8 to avoid collisions between similar business numbers
                if (!contact && phonePart.length >= 10) {
                    const suffix = phonePart.slice(-10);
                    this.logger.log(`No exact match. Trying fuzzy match for suffix: ${suffix}`);

                    // Search in BOTH externalId and phoneNumber columns
                    const fuzzyMatches = await this.contactRepository.find({
                        where: [
                            { externalId: Like(`%${suffix}`), tenantId },
                            { phoneNumber: Like(`%${suffix}`), tenantId }
                        ],
                        take: 1,
                        order: { createdAt: 'DESC' }
                    });

                    if (fuzzyMatches.length > 0) {
                        contact = fuzzyMatches[0];

                        // SMART LINK RULES:
                        const isNewLid = externalId.includes('@lid');
                        const isCurrentLid = contact.externalId?.includes('@lid');
                        const isSameInstance = !contact.instance || contact.instance === instanceName;

                        // Only update if:
                        // 1. It's a real phone number (upgrade from LID)
                        // 2. OR it's a LID from the same instance
                        let shouldUpdate = false;
                        if (!isNewLid && isCurrentLid) shouldUpdate = true; // Upgrade to phone
                        if (isNewLid && isSameInstance) shouldUpdate = true; // Same instance update
                        if (!isNewLid && !isCurrentLid) shouldUpdate = true; // Phone to Phone update

                        if (shouldUpdate) {
                            this.logger.log(`[Smart Link] Fuzzy matched contact: ${contact.name}. Updating externalId: ${contact.externalId} -> ${externalId}`);
                            contact.externalId = externalId;
                            await this.contactRepository.save(contact);
                        }
                    }
                }

                // STEP 3: Auto-link externalId if found by phone but externalId is missing
                if (contact && !contact.externalId) {
                    this.logger.log(`[Smart Link] Found contact by Phone. Linking initial externalId: ${externalId}`);
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

                    // Fallback to suffix matching (last 10 digits) if exact match fails
                    if (!lead && externalId.length >= 10) {
                        const suffix = externalId.slice(-10);
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
                        tenantId,
                        instance: instanceName // Save Instance Name (FIXED: was data.instance)
                    });
                    await this.contactRepository.save(contact);
                } else {
                    // Update instance if missing or changed
                    if ((!contact.instance || contact.instance !== instanceName) && instanceName) {
                        contact.instance = instanceName;
                        await this.contactRepository.save(contact);
                    }
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
                const wamid = messageData.key.id;
                const existingMessage = await this.messageRepository.findOne({
                    where: { wamid, contactId: contact.id, direction: isOutbound ? 'outbound' : 'inbound' }
                });
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

                // AI AUTO-RESPONSE LOGIC
                // Check if AI should respond to this message (INBOUND ONLY)
                if (!isOutbound) {
                    try {
                        const shouldRespond = await this.aiService.shouldRespond(contact, instanceName, tenantId);

                        if (shouldRespond) {
                            this.logger.log(`AI enabled for contact ${contact.id} on instance ${instanceName}. Generating response...`);

                            // Generate AI response
                            const aiResponse = await this.aiService.generateResponse(contact, content, tenantId, instanceName);

                            if (aiResponse) {
                                this.logger.log(`AI generated response for ${contact.id}: ${aiResponse.substring(0, 50)}...`);
                                // Save AI response to database
                                const aiMessage = this.messageRepository.create({
                                    tenantId,
                                    contactId: contact.id,
                                    content: aiResponse,
                                    direction: 'outbound',
                                    provider: 'whatsapp',
                                });
                                await this.messageRepository.save(aiMessage);

                                // Send AI response via Evolution API (passing instanceName to ensure context lock)
                                await this.aiService.sendAIResponse(contact, aiResponse, tenantId, instanceName);

                                this.logger.log(`AI response sent successfully to contact ${contact.id} via ${instanceName}`);
                            } else {
                                this.logger.warn(`AI failed to generate response for contact ${contact.id} (Check Gemini API Key and Prompt Configuration)`);
                            }
                        } else {
                            this.logger.debug(`AI should not respond to contact ${contact.id} on instance ${instanceName}`);
                        }
                    } catch (aiError) {
                        this.logger.error(`AI auto-response error: ${aiError.message}`);
                        // Don't throw - AI errors shouldn't break the webhook
                    }
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
                    // 2. LID LINKING MAGIC - Strict instance-locked rules
                    if (remoteJid && message.contactId) {
                        const contact = await this.contactRepository.findOne({ where: { id: message.contactId } });
                        if (contact) {
                            const newExternalId = remoteJid.replace(/:[0-9]+/, '');
                            const currentExternalId = contact.externalId;

                            const isNewLid = newExternalId.includes('@lid');
                            const isCurrentLid = currentExternalId?.includes('@lid');
                            const isSameInstance = !contact.instance || contact.instance === instanceName;

                            let shouldUpdate = false;
                            if (!isNewLid && isCurrentLid) shouldUpdate = true; // Upgrade to phone
                            if (isNewLid && isSameInstance) shouldUpdate = true; // Same instance LID update
                            if (!isNewLid && !isCurrentLid && newExternalId !== currentExternalId) shouldUpdate = true;

                            if (shouldUpdate && !newExternalId.includes('status')) {
                                this.logger.log(`[Smart Link] Updating JID: ${currentExternalId} -> ${newExternalId} (Instance: ${instanceName})`);
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
