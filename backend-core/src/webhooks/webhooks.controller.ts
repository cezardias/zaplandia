import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CrmService } from '../crm/crm.service';
import { AiService } from '../ai/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { N8nService } from '../integrations/n8n.service';
import { Repository, Like } from 'typeorm';
import { Integration } from '../integrations/entities/integration.entity';
import { Contact, Message } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EvolutionApiService } from '../integrations/evolution-api.service';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly crmService: CrmService,
        private readonly aiService: AiService,
        private readonly integrationsService: IntegrationsService,
        private readonly n8nService: N8nService,
        private readonly evolutionApiService: EvolutionApiService,
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
    ) { }

    // Meta (Face/Insta/WhatsApp) Webhook verification
    @Get('meta')
    async verifyMeta(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
        this.logger.log('Verifying Meta Webhook...');
        // Default verify token or could fetch from DB
        const metaConfig = await this.integrationsService.getCredential(null, 'META_APP_CONFIG', true);
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
        // --- 1. SUPER FAST BYPASS FOR META TESTS ---
        if (payload?.entry?.[0]?.id === '0' || payload?.sample) {
            this.logger.log(`[META_WEBHOOK_TEST] Fast-track test detected. Returning 200 OK (Empty).`);
            return; // Returns 200 OK with empty body
        }

        // --- 2. LOGGING FOR REAL REQUESTS ---
        this.logger.log(`[META_WEBHOOK_RAW] Payload: ${JSON.stringify(payload)}`);

        if (!payload || (payload.object !== 'instagram' && payload.object !== 'whatsapp_business_account')) {
            return; // Just return 200 OK even if skipped
        }

        const entries = payload.entry || [];
        if (entries.length === 0) return;

        // --- 3. WHATSAPP OFFICIAL HANDLER ---
        if (payload.object === 'whatsapp_business_account') {
            try {
                for (const entry of entries) {
                    const wabaIdInPayload = entry.id;
                    const changes = entry.changes || [];

                    for (const change of changes) {
                        const field = change.field;
                        const value = change.value;
                        if (!value) continue;

                        const phoneNumberIdInPayload = value.metadata?.phone_number_id;
                        const displayPhoneNumber = value.metadata?.display_phone_number;

                        // Identify Tenant
                        let tenantId: string | null = null;
                        
                        // We check for exact matches in the credentials JSONB field
                        const integration = await this.integrationRepository.createQueryBuilder('i')
                            .where("i.credentials->>'META_WABA_ID' = :wabaId", { wabaId: wabaIdInPayload })
                            .orWhere("i.credentials->>'META_PHONE_NUMBER_ID' = :phoneId", { phoneId: phoneNumberIdInPayload })
                            .getOne();

                        if (integration) {
                            tenantId = integration.tenantId;
                        } else {
                            const cred = await this.integrationsService.findCredentialByValue('META_WABA_ID', wabaIdInPayload);
                            tenantId = cred?.tenantId || null;
                        }

                        if (!tenantId) {
                            this.logger.warn(`[META_WEBHOOK] No tenant found for WABA ID: ${wabaIdInPayload}`);
                            continue;
                        }

                        const instanceName = integration?.credentials?.instanceName || integration?.credentials?.name || displayPhoneNumber || phoneNumberIdInPayload || 'MetaOfficial';

                        // 2. Process Status Updates (Delivery Receipts)
                        if (value.statuses) {
                            for (const statusObj of value.statuses) {
                                const wamid = statusObj.id;
                                const status = statusObj.status.toUpperCase();
                                
                                this.logger.debug(`[META_WA] Status Update: ${wamid} -> ${status}`);

                                const message = await this.messageRepository.findOne({ where: { wamid } });
                                if (message) {
                                    message.status = status;
                                    await this.messageRepository.save(message);
                                }
                            }
                        }

                        // 3. Process Inbound Messages
                        if (value.messages) {
                            for (const msg of value.messages) {
                                const from = msg.from; // Phone number string
                                const wamid = msg.id;
                                let content = '';

                                if (msg.type === 'text') content = msg.text.body;
                                else if (msg.type === 'button') content = msg.button.text;
                                else if (msg.type === 'interactive') {
                                    content = msg.interactive.button_reply?.title || msg.interactive.list_reply?.title || 'Interactive Message';
                                } else {
                                    content = `[${msg.type.toUpperCase()}]`;
                                }

                                if (!content) {
                                    this.logger.warn(`[META_WA] Skipping message ${wamid} with no extractable content.`);
                                    continue;
                                }

                                this.logger.log(`[META_WA] Inbound from ${from}: ${content.substring(0, 50)}...`);

                                // Find/Create Contact - Global Number Friendly
                                let contact = await this.contactRepository.findOne({
                                    where: { externalId: from, tenantId }
                                });

                                if (!contact) {
                                    // Extract profile name if Meta provided it
                                    const profileName = value.contacts?.find(c => c.wa_id === from)?.profile?.name;
                                    
                                    this.logger.debug(`[META_WA] Creating new contact for global number: ${from}`);
                                    contact = await this.crmService.ensureContact(tenantId, {
                                        name: profileName || `WhatsApp ${from}`,
                                        phoneNumber: from,
                                        externalId: from,
                                        provider: 'whatsapp',
                                        instance: instanceName
                                    });
                                }

                                // Idempotency check
                                const exists = await this.messageRepository.findOne({ where: { wamid } });
                                if (exists) {
                                    this.logger.debug(`[META_WA] Duplicate message ${wamid} skipped.`);
                                    continue;
                                }

                                // Save Message
                                const message = this.messageRepository.create({
                                    tenantId,
                                    contactId: contact.id,
                                    content,
                                    direction: 'inbound',
                                    provider: 'whatsapp',
                                    instance: instanceName,
                                    wamid
                                });
                                await this.messageRepository.save(message);

                                contact.lastMessage = content;
                                contact.updatedAt = new Date();
                                await this.contactRepository.save(contact);

                                // --- AUTOMATION LOGIC ---
                                const isN8nEnabledGlobally = integration?.n8nEnabled ?? false;
                                const isN8nActiveForContact = contact.n8nEnabled !== false;
                                const isAiActiveForContact = contact.aiEnabled !== false;

                                if (isN8nEnabledGlobally && isN8nActiveForContact) {
                                    this.logger.log(`[META_WA] Triggering n8n for ${from}`);
                                    await this.n8nService.triggerWebhook(tenantId, {
                                        type: 'whatsapp.message',
                                        sender: from,
                                        content,
                                        contact_id: contact.id,
                                        name: contact.name,
                                        message_id: message.id
                                    }, integration);
                                }

                                // Fallback AI logic
                                if (isAiActiveForContact && (!isN8nEnabledGlobally || !isN8nActiveForContact)) {
                                    const shouldRespond = await this.aiService.shouldRespond(contact, instanceName, tenantId);
                                    if (shouldRespond) {
                                        this.logger.log(`[META_WA] Triggering internal AI for ${from}`);
                                        const aiResponse = await this.aiService.generateResponse(contact, content, tenantId, instanceName);
                                        if (aiResponse) {
                                            const aiMsg = this.messageRepository.create({
                                                tenantId,
                                                contactId: contact.id,
                                                content: aiResponse,
                                                direction: 'outbound',
                                                provider: 'whatsapp',
                                                instance: instanceName,
                                                status: 'PENDING'
                                            });
                                            await this.messageRepository.save(aiMsg);
                                            await this.aiService.sendAIResponse(contact, aiResponse, tenantId, instanceName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                this.logger.error('Error processing WhatsApp Official Webhook', error.stack);
            }
            return { status: 'received' };
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
                            const contact = await this.crmService.ensureContact('default-tenant', {
                                name: `Instagram User ${senderId.slice(-4)}`,
                                externalId: senderId,
                                provider: 'instagram',
                                instance: tenantId
                            });

                            // Save message
                            const message = this.messageRepository.create({
                                tenantId: 'default-tenant',
                                contactId: contact.id,
                                content: text,
                                direction: 'inbound',
                                provider: 'instagram',
                                instance: tenantId
                            });
                            await this.messageRepository.save(message);

                            // Update Contact Stage on Reply
                            if (['NOVO', 'LEAD', 'CONTACTED', 'SENT'].includes(contact.stage || '')) {
                                await this.crmService.updateContact('default-tenant', contact.id, { stage: 'NEGOTIATION' });
                            }

                            // Automation logic for Instagram
                            const isN8nActiveForContact = contact.n8nEnabled !== false;

                            if (isN8nActiveForContact) {
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
        // --- EMERGENCY DEBUG LOGGING ---
        this.logger.log(`[EVOLUTION_WEBHOOK_RAW] Payload: ${JSON.stringify(payload)}`);

        const { event: eventType, sender, instance, data } = payload;

        // Extract tenantId using multiple strategies
        let tenantId = 'default';
        let instanceName = typeof instance === 'string' ? instance : (instance?.instanceName || instance?.name || '');

        // Strategy 0: Find integration by instance name (most reliable after migrations)
        const existingIntegration = await this.integrationRepository.createQueryBuilder('i')
            .where(`(i.settings->>'instanceName' = :instanceName OR i.credentials->>'instanceName' = :instanceName OR i.credentials->>'name' = :instanceName)`, { instanceName })
            .getOne();

        if (existingIntegration) {
            tenantId = existingIntegration.tenantId;
            this.logger.debug(`[EVOLUTION_WEBHOOK] Found tenant ${tenantId} via integration record for instance ${instanceName}`);
        } else {
            // Strategy 1: regex to extract UUID from tenant_{UUID}_... format (fallback)
            const uuidMatch = instanceName.match(/^tenant_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
            if (uuidMatch) {
                tenantId = uuidMatch[1];
            } else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(instanceName)) {
                // Strategy 2: instanceName IS the UUID itself
                tenantId = instanceName;
            } else if (instanceName.startsWith('tenant_')) {
                // Strategy 3: starts with tenant_ but doesn't follow strict UUID format
                tenantId = instanceName.replace('tenant_', '').split('_')[0];
            } else if (sender && typeof sender === 'string') {
                // Strategy 4: try sender field for same patterns
                const senderMatch = sender.match(/^tenant_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
                if (senderMatch) {
                    tenantId = senderMatch[1];
                    instanceName = sender;
                }
            }

            this.logger.log(`[EVOLUTION_WEBHOOK] Event: ${eventType}, Tenant Extracted: ${tenantId}, Instance: ${instanceName}`);

            if (tenantId === 'default') {
                this.logger.error(`[CRITICAL] FAILED TO EXTRACT TENANT ID from payload. Key fields: instance=${instanceName}, sender=${sender}`);
            } else {
                const tenantExists = await this.integrationsService.checkTenantExists(tenantId);
                if (!tenantExists) {
                    this.logger.warn(`[WEBHOOK] Tenant ${tenantId} does not exist in DB (orphaned instance?). Skipping message.`);
                    return { status: 'skipped_no_tenant' };
                }
            }
        }

        // Fetch integration detail if not already found (for n8n/AI config)
        const integration = existingIntegration || await this.integrationRepository.createQueryBuilder('i')
            .where('i.tenantId = :tenantId', { tenantId })
            .andWhere(`(i.settings->>'instanceName' = :instanceName OR i.credentials->>'instanceName' = :instanceName OR i.credentials->>'name' = :instanceName)`, { instanceName })
            .getOne();

        // Normalize eventType: EvolutionAPI may send 'messages.upsert' or 'MESSAGES_UPSERT'
        // Normalize to uppercase with underscores for consistent comparison
        const normalizedEvent = (eventType || '').toUpperCase().replace(/\./g, '_');
        this.logger.debug(`[EVOLUTION_WEBHOOK] Normalized event: ${normalizedEvent} (original: ${eventType})`);

        if (normalizedEvent === 'MESSAGES_UPSERT' || normalizedEvent === 'SEND_MESSAGE') {

            const messageData = data.data || data; // Handle potential structure variations

            if (!messageData || !messageData.key) {
                this.logger.log(`Ignoring message: Data incomplete.`);
                return { status: 'ignored' };
            }

            const isOutbound = messageData.key.fromMe === true;
            const remoteJid = messageData.key.remoteJid; // e.g., 5511999998888@s.whatsapp.net
            const pushName = messageData.pushName || payload.sender || (isOutbound ? 'Sistema' : 'WhatsApp User');

            // Extract text content (Enhanced for Global/Meta templates)
            let content = '';
            const msg = messageData.message;
            
            if (msg?.conversation) content = msg.conversation;
            else if (msg?.extendedTextMessage?.text) content = msg.extendedTextMessage.text;
            else if (msg?.imageMessage?.caption) content = msg.imageMessage.caption;
            else if (messageData.extendedTextMessage?.text) content = messageData.extendedTextMessage.text;
            // Support for Meta/Evolution Template Messages
            else if (msg?.templateMessage?.hydratedTemplate?.hydratedContentText) {
                content = msg.templateMessage.hydratedTemplate.hydratedContentText;
            } else if (msg?.templateMessage?.hydratedTemplate?.hydratedButtons) {
                content = msg.templateMessage.hydratedTemplate.hydratedContentText || '[Template Message]';
            } else if (msg?.buttonsResponseMessage?.selectedButtonId) {
                content = msg.buttonsResponseMessage.selectedDisplayText || msg.buttonsResponseMessage.selectedButtonId;
            } else if (msg?.listResponseMessage?.title) {
                content = msg.listResponseMessage.title;
            }

            if (!content) {
                this.logger.warn(`Message from ${remoteJid} has no text content. Type: ${messageData.messageType || 'unknown'}`);
                return { status: 'no_content' };
            }

            this.logger.log(`WhatsApp (${isOutbound ? 'OUT' : 'IN'}) from ${pushName} (${remoteJid}): ${content}`);

            // Clean remoteJid for externalId (strip device suffixes like :7 but keep @s.whatsapp.net or @lid)
            const externalId = remoteJid.replace(/:[0-9]+/, '');
            
            // NEW: Extract alternative JID or Phone if Evolution provided them (Resolves LIDs)
            const remoteJidAlt = messageData.remoteJidAlt || messageData.key.remoteJidAlt || null;
            const senderPn = messageData.senderPn || messageData.pushNumber || null;
            
            this.logger.debug(`[JID_METADATA] remoteJid: ${remoteJid}, alt: ${remoteJidAlt}, pn: ${senderPn}`);
            
            const phonePart = (senderPn || remoteJidAlt || externalId).split('@')[0].replace(/\D/g, '');
            
            try {
                // STEP 1 & 2: Resolved contact via Centralized CRM Service (Handles Deduplication & Merging)
                const contact = await this.crmService.ensureContact(tenantId, {
                    name: pushName,
                    phoneNumber: phonePart,
                    externalId: externalId,
                    instance: instanceName,
                    alternativeId: remoteJidAlt // Pass for smarter merging
                });

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
                    wamid: messageData.key.id, // Save External WhatsApp ID
                    instance: instanceName
                });
                await this.messageRepository.save(message);
                this.logger.log(`Message saved successfully. ID: ${message.id}`);

                // Update contact meta info to show in inbox
                contact.lastMessage = content;
                contact.updatedAt = new Date(); // Explicitly touch updatedAt
                await this.contactRepository.save(contact);

                // Update Contact Stage on Reply (INBOUND ONLY)
                // We only move to NEGOTIATION if it's a real inbound message from the customer
                if (!isOutbound && ['NOVO', 'LEAD', 'CONTACTED', 'SENT'].includes(contact.stage || '')) {
                    await this.crmService.updateContact(tenantId, contact.id, { stage: 'NEGOTIATION' });
                    this.logger.log(`Updated contact ${contact.id} stage to NEGOTIATION due to reply`);
                }

                // RE-FETCH contact to ensure latest aiEnabled/n8nEnabled flags
                const freshContact = await this.crmService.findOne(contact.id, tenantId);
                const useContact = freshContact || contact;

                // Trigger n8n for AI Automation (INBOUND ONLY to avoid infinite loops)
                // Respect contact-level override if present, otherwise follow integration setting
                const isN8nActiveForContact = useContact.n8nEnabled !== false; 
                this.logger.debug(`[AUTOMATION_CHECK] Contact ${useContact.id}: n8nEnabled=${useContact.n8nEnabled}, aiEnabled=${useContact.aiEnabled}. n8nActive=${isN8nActiveForContact}`);

                if (!isOutbound && isN8nActiveForContact) {
                    try {
                        const n8nResponse = await this.n8nService.triggerWebhook(tenantId, {
                            type: 'whatsapp.message',
                            sender: remoteJid,
                            content,
                            contact_id: useContact.id,
                            name: pushName,
                            message_id: message.id
                        }, integration);
                        
                        this.logger.log('Triggered n8n webhook');

                        // Process n8n response if it contains messages to send back
                        if (n8nResponse) {
                            const responses = Array.isArray(n8nResponse) ? n8nResponse : [n8nResponse];
                            for (const res of responses) {
                                const textToSend = res.textMessage || res.text || res.message;
                                if (textToSend) {
                                    this.logger.log(`[N8N_RESPONSE] Sending message from n8n to ${remoteJid} via Centralized CRM`);
                                    
                                    // NO MANUAL SAVE HERE - sendMessage handles it
                                    await this.crmService.sendMessage(tenantId, contact.id, textToSend);
                                }
                            }
                        }
                    } catch (n8nError) {
                        this.logger.error(`Failed to trigger n8n: ${n8nError.message}`);
                    }
                }

                // AI AUTO-RESPONSE LOGIC
                // Check if AI should respond to this message (INBOUND ONLY)
                if (!isOutbound) {
                    try {
                        const isN8nEnabledGlobally = integration?.n8nEnabled ?? false;
                        const isN8nActiveForContact = useContact.n8nEnabled !== false;

                        // AI auto-response is a fallback if n8n is NOT handling this contact
                        if (isN8nEnabledGlobally && isN8nActiveForContact) {
                            this.logger.log(`n8n is active for this contact on instance ${instanceName}. Skipping internal AI auto-response.`);
                        } else {
                            // If n8n is disabled globally OR paused for this contact, AI can take over
                            const shouldRespond = await this.aiService.shouldRespond(useContact, instanceName, tenantId);

                            if (shouldRespond) {
                                this.logger.log(`AI responding to contact ${useContact.id} (n8n was ${isN8nEnabledGlobally ? 'paused for contact' : 'disabled globally'})`);

                                // Generate AI response
                                const aiResponse = await this.aiService.generateResponse(useContact, content, tenantId, instanceName);

                                if (aiResponse) {
                                    this.logger.log(`AI generated response for ${contact.id}: ${aiResponse.substring(0, 50)}...`);
                                    
                                    // Use CENTRALIZED CRM Message Router
                                    await this.crmService.sendMessage(tenantId, contact.id, aiResponse);
                                    this.logger.log(`AI response sent successfully to contact ${contact.id} via Centralized CRM`);
                                } else {
                                    this.logger.warn(`AI failed to generate response for contact ${contact.id}`);
                                }
                            } else {
                                this.logger.debug(`AI disabled or not configured for contact ${contact.id}`);
                            }
                        }
                    } catch (aiError) {
                        this.logger.error(`AI auto-response error: ${aiError.message}`);
                    }
                }

            } catch (err) {
                this.logger.error(`Error processing WhatsApp message: ${err.message}`, err.stack);
                throw err;
            }
        } else if (normalizedEvent === 'MESSAGES_UPDATE') {
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

    @Post('n8n/response')
    @HttpCode(HttpStatus.OK)
    async handleN8nResponse(@Body() payload: { tenantId: string; contactId: string; content: string; instanceName?: string }) {
        const { tenantId, contactId, content, instanceName } = payload;
        this.logger.log(`[N8N_RESPONSE] Received response for contact ${contactId} in tenant ${tenantId}`);

        try {
            const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
            if (!contact) {
                this.logger.error(`[N8N_RESPONSE] Contact ${contactId} not found for tenant ${tenantId}`);
                return { success: false, error: 'Contact not found' };
            }

            const useInstance = instanceName || contact.instance;
            if (!useInstance) {
                this.logger.error(`[N8N_RESPONSE] No instance found or provided for contact ${contactId}`);
                return { success: false, error: 'Instance not found' };
            }

            // Save outbound message
            const message = this.messageRepository.create({
                tenantId,
                contactId: contact.id,
                content,
                direction: 'outbound',
                provider: contact.provider as any || 'whatsapp',
                instance: useInstance,
                status: 'PENDING'
            });
            await this.messageRepository.save(message);

            // Send via AI service (it handles both Evolution and Meta)
            await this.aiService.sendAIResponse(contact, content, tenantId, useInstance);

            return { success: true, messageId: message.id };
        } catch (error) {
            this.logger.error(`[N8N_RESPONSE] Error sending n8n response: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
