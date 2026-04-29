import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UniversalAuthGuard } from '../auth/guards/universal-auth.guard';
import { CommsService } from '@comms/comms.service';
import { CrmService } from '../crm/crm.service';
import { AiService } from '../ai/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { N8nService } from '../integrations/n8n.service';
import { Repository, Like, Raw } from 'typeorm';
import { Integration, IntegrationProvider } from '../integrations/entities/integration.entity';
import { Contact, Message } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EvolutionApiService } from '../integrations/evolution-api.service';
import { MetaApiService } from '../integrations/meta-api.service';
import { ApiCredential } from '../integrations/entities/api-credential.entity';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly crmService: CrmService,
        private readonly aiService: AiService,
        private readonly integrationsService: IntegrationsService,
        private readonly n8nService: N8nService,
        private readonly evolutionApiService: EvolutionApiService,
        private readonly metaApiService: MetaApiService,
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        @InjectRepository(ApiCredential)
        private apiCredentialRepository: Repository<ApiCredential>,
        private readonly communicationService: CommsService,
    ) { }

    // Meta (Face/Insta/WhatsApp) Webhook verification
    @Get('meta')
    async verifyMeta(
        @Query() query: Record<string, any>,
        @Res() res: Response
    ) {
        // qs may parse 'hub.verify_token' as nested object OR flat key depending on config
        const mode      = query['hub.mode']         ?? query?.hub?.mode;
        const token     = query['hub.verify_token'] ?? query?.hub?.verify_token;
        const challenge = query['hub.challenge']    ?? query?.hub?.challenge;

        this.logger.log(`[META_VERIFY] Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);
        this.logger.debug(`[META_VERIFY] Raw query: ${JSON.stringify(query)}`);

        const metaConfig = await this.integrationsService.getCredential(null, 'META_APP_CONFIG', true);
        let expectedToken = 'zaplandia_verify_token';

        try {
            if (metaConfig) {
                const parsed = JSON.parse(metaConfig);
                if (parsed.verifyToken) expectedToken = parsed.verifyToken;
            }
        } catch (e) { }

        if (mode === 'subscribe' && token === expectedToken) {
            this.logger.log('[META_VERIFY] ✅ Webhook verified successfully!');
            // CRITICAL: Must return plain text, NOT JSON — Meta rejects JSON-wrapped challenges
            return res.status(200).send(challenge);
        }

        this.logger.warn(`[META_VERIFY] ❌ Verification failed. Expected: ${expectedToken}, Got: ${token}`);
        return res.status(403).send('Forbidden');

    }

    // Handle Meta payloads (Instagram focus)
    @Post('meta')
    @HttpCode(HttpStatus.OK)
    async handleMeta(@Body() payload: any) {
        if (payload?.entry?.[0]?.id === '0' || payload?.sample) {
            this.logger.log(`[META_WEBHOOK_TEST] Fast-track test detected. Returning 200 OK.`);
            return {}; 
        }

        if (!payload || (payload.object !== 'instagram' && payload.object !== 'whatsapp_business_account')) {
            return {}; 
        }

        try {
            this.processMetaPayload(payload).catch(err => {
                this.logger.error(`[META_WEBHOOK_ERROR] Background processing failed: ${err.message}`, err.stack);
            });
        } catch (e) {
            this.logger.error(`[META_WEBHOOK_ERROR] Initiating processing failed: ${e.message}`);
        }

        return { status: 'received' };
    }

    private async processMetaPayload(payload: any) {
        this.logger.log(`[META_WEBHOOK_RAW] Payload: ${JSON.stringify(payload)}`);
        const entries = payload.entry || [];
        if (entries.length === 0) return;

        if (payload.object === 'whatsapp_business_account') {
            for (const entry of entries) {
                const wabaIdInPayload = entry.id;
                const changes = entry.changes || [];

                for (const change of changes) {
                    const field = change.field;
                    const value = change.value;
                    if (!value || field !== 'messages') continue;

                    const phoneNumberIdInPayload = value.metadata?.phone_number_id;
                    const displayPhoneNumber = value.metadata?.display_phone_number;

                    const integration = await this.integrationRepository.createQueryBuilder('i')
                        .where("i.credentials->>'META_WABA_ID' = :wabaId", { wabaId: wabaIdInPayload })
                        .orWhere("i.credentials->>'META_PHONE_NUMBER_ID' = :phoneId", { phoneId: phoneNumberIdInPayload })
                        .getOne();

                    let tenantId = integration?.tenantId;
                    if (!tenantId) {
                        const cred = await this.integrationsService.findCredentialByValue('META_WABA_ID', wabaIdInPayload);
                        tenantId = cred?.tenantId || undefined;
                    }

                    // Fallback to searching inside META_APP_CONFIG JSON
                    if (!tenantId) {
                        const configCred = await this.apiCredentialRepository.createQueryBuilder('c')
                            .where("c.key_name = 'META_APP_CONFIG'")
                            .andWhere("c.key_value LIKE :val", { val: `%${wabaIdInPayload}%` })
                            .getOne();
                        tenantId = configCred?.tenantId || undefined;
                    }

                    if (!tenantId) {
                        this.logger.warn(`[META_WEBHOOK] No tenant found for WABA ID: ${wabaIdInPayload}`);
                        continue;
                    }

                    const instanceName = integration?.credentials?.instanceName || 
                                         integration?.credentials?.name || 
                                         phoneNumberIdInPayload || 
                                         displayPhoneNumber || 
                                         'MetaOfficial';

                    if (value.statuses) {
                        for (const statusObj of value.statuses) {
                            const wamid = statusObj.id;
                            const status = statusObj.status.toUpperCase();
                            const message = await this.messageRepository.findOne({ where: { wamid } });
                            if (message) {
                                message.status = status;
                                await this.messageRepository.save(message);
                                
                                // ✅ Emitir atualização de status via WebSocket
                                this.communicationService.emitToTenant(tenantId, 'message_status', {
                                    messageId: message.id,
                                    status: status
                                });
                            }
                        }
                    }

                    if (value.messages) {
                        for (const msg of value.messages) {
                            const from = msg.from;
                            const wamid = msg.id;
                            let content = '';

                            if (msg.type === 'text') content = msg.text.body;
                            else if (msg.type === 'button') content = msg.button.text;
                            else if (msg.type === 'interactive') {
                                content = msg.interactive.button_reply?.title || msg.interactive.list_reply?.title || 'Interactive';
                            } else if (['image', 'video', 'audio', 'document', 'sticker'].includes(msg.type)) {
                                content = `[${msg.type.toUpperCase()} RECEIVED]`;
                            } else {
                                content = `[${msg.type.toUpperCase()}]`;
                            }

                            if (!content) continue;

                            const profileName = value.contacts?.find(c => c.wa_id === from)?.profile?.name;
                            let contact = await this.crmService.ensureContact(tenantId, {
                                name: profileName || `WhatsApp ${from}`,
                                phoneNumber: from,
                                externalId: from,
                                provider: 'whatsapp',
                                instance: instanceName
                            });

                            const exists = await this.messageRepository.findOne({ where: { wamid } });
                            if (exists) continue;

                            const message = this.messageRepository.create({
                                tenantId, contactId: contact.id, content,
                                direction: 'inbound', provider: 'whatsapp',
                                instance: instanceName, wamid
                            });
                            await this.messageRepository.save(message);

                            // ✅ Emitir nova mensagem via WebSocket
                            this.communicationService.emitToTenant(tenantId, 'new_message', {
                                ...message,
                                contact: { id: contact.id, name: contact.name }
                            });

                            // ✅ Trigger Pipeline Qualification Automation
                            await this.crmService.triggerLeadQualification(tenantId, contact.id, 'REPLY');

                            contact.lastMessage = content;
                            await this.contactRepository.save(contact);

                            const globalN8n = await this.integrationsService.getCredential(tenantId, 'N8N_WEBHOOK_URL', true);
                            const providerConfigStr = await this.integrationsService.getCredential(tenantId, 'N8N_PROVIDER_CONFIG', true);
                            let hasN8n = !!globalN8n;
                            if (!hasN8n && providerConfigStr) {
                                try {
                                    const config = JSON.parse(providerConfigStr);
                                    if (config['whatsapp']) hasN8n = true;
                                } catch (e) {}
                            }
                            this.logger.debug(`[META_WA] Check n8n: hasUrl=${hasN8n}, contactEnabled=${contact.n8nEnabled}`);
                            
                            if (hasN8n && contact.n8nEnabled !== false) {
                                this.logger.log(`[META_WA] Triggering n8n for ${contact.name} (Tenant: ${tenantId}) -> (Using global or provider mapping)`);
                                const n8nResponse = await this.n8nService.triggerWebhook(tenantId, {
                                    provider: 'whatsapp',
                                    type: 'whatsapp.message', sender: from, content,
                                    contact_id: contact.id, name: contact.name, message_id: message.id
                                }, integration);

                                if (n8nResponse) {
                                    const resBuffer = Array.isArray(n8nResponse) ? n8nResponse : [n8nResponse];
                                    for (const r of resBuffer) {
                                        let text = r.output || (typeof r.message === 'object' ? r.message.text : null) || r.textMessage || r.text || r.message;
                                        if (text && typeof text !== 'string') text = JSON.stringify(text);

                                        if (text) await this.crmService.sendMessage(tenantId, contact.id, text);
                                    }
                                }
                            } else if (contact.aiEnabled !== false) {
                                const shouldRespond = await this.aiService.shouldRespond(contact, instanceName, tenantId);
                                if (shouldRespond) {
                                    const aiResp = await this.aiService.generateResponse(contact, content, tenantId, instanceName);
                                    if (aiResp) await this.crmService.sendMessage(tenantId, contact.id, aiResp);
                                }
                            }
                        }
                    }
                }
            }
        } else if (payload.object === 'instagram') {
            try {
                for (const entry of entries) {
                    const pageId = entry.id; // This is the Facebook Page ID linked to Instagram
                    this.logger.log(`[INSTAGRAM_WEBHOOK] Entry ID: ${pageId}. Object: ${payload.object}`);

                    // --- MULTITENANT: find tenant by INSTAGRAM_PAGE_ID credential ---
                    const pageCred = await this.integrationsService.findCredentialByValue('INSTAGRAM_PAGE_ID', pageId);
                    let tenantId = pageCred?.tenantId;

                    if (tenantId) this.logger.debug(`[INSTAGRAM_WEBHOOK] Tenant ${tenantId} found by direct INSTAGRAM_PAGE_ID match.`);

                    // Fallback: search inside ALL credentials for this value (wide search)
                    if (!tenantId) {
                        this.logger.debug(`[INSTAGRAM_WEBHOOK] No direct match. Searching inside all JSON configs (LIKE %${pageId}%)...`);
                        const configCred = await this.apiCredentialRepository.createQueryBuilder('c')
                            .where("c.key_value LIKE :val", { val: `%${pageId}%` })
                            .getOne();
                        tenantId = configCred?.tenantId || undefined;
                        if (tenantId) this.logger.debug(`[INSTAGRAM_WEBHOOK] Tenant ${tenantId} found by LIKE match in key ${configCred?.key_name}.`);
                    }

                    if (!tenantId) {
                        this.logger.warn(`[INSTAGRAM_WEBHOOK] Still no tenant found for Page ID: ${pageId}. Search query didn't find any match.`);
                        continue;
                    }

                    this.logger.log(`[INSTAGRAM_WEBHOOK] Processing entry for Page ${pageId} → Tenant ${tenantId}`);

                    // --- Direct Messages ---
                    if (entry.messaging) {
                        for (const messaging of entry.messaging) {
                            const senderId = messaging.sender?.id;
                            const recipientId = messaging.recipient?.id;
                            if (!senderId || senderId === pageId) continue; // skip echo/outbound

                            const text = messaging.message?.text;
                            const attachments = messaging.message?.attachments;
                            let content = text || '';

                            if (!content && attachments?.length > 0) {
                                const att = attachments[0];
                                content = `[${(att.type || 'arquivo').toUpperCase()} RECEBIDO]`;
                            }

                            if (!content) continue;

                            const wamid = messaging.message?.mid;

                            // Dedup
                            if (wamid) {
                                const exists = await this.messageRepository.findOne({ where: { wamid } });
                                if (exists) {
                                    this.logger.debug(`[INSTAGRAM_WEBHOOK] Duplicate message skipped: ${wamid}`);
                                    continue;
                                }
                            }

                            // Fetch real name from Instagram Graph API
                            let profileName = `Instagram ${senderId.slice(-4)}`;
                            try {
                                const profile = await this.metaApiService.getInstagramUserProfile(tenantId, senderId);
                                if (profile?.name) profileName = profile.name;
                            } catch (e) { /* profile fetch is best-effort */ }

                            const contact = await this.crmService.ensureContact(tenantId, {
                                name: profileName,
                                externalId: senderId,
                                provider: 'instagram',
                                instance: pageId,
                            });

                            const message = this.messageRepository.create({
                                tenantId,
                                contactId: contact.id,
                                content,
                                direction: 'inbound',
                                provider: 'instagram',
                                instance: pageId,
                                wamid: wamid || undefined,
                            });
                            await this.messageRepository.save(message);

                            // Emit via WebSocket to inbox
                            this.communicationService.emitToTenant(tenantId, 'new_message', {
                                ...message,
                                contact: { id: contact.id, name: contact.name, provider: 'instagram' }
                            });

                            // Update last message on contact
                            contact.lastMessage = content;
                            await this.contactRepository.save(contact);

                            this.logger.log(`[INSTAGRAM_WEBHOOK] ✅ DM from ${profileName} (${senderId}) saved and emitted`);

                            // N8N or AI response
                            const globalN8n = await this.integrationsService.getCredential(tenantId, 'N8N_WEBHOOK_URL', true);
                            const providerConfigStr = await this.integrationsService.getCredential(tenantId, 'N8N_PROVIDER_CONFIG', true);
                            let hasN8n = !!globalN8n;
                            if (!hasN8n && providerConfigStr) {
                                try {
                                    const config = JSON.parse(providerConfigStr);
                                    if (config['instagram']) hasN8n = true;
                                } catch (e) {}
                            }
                            if (hasN8n && contact.n8nEnabled !== false) {
                                const n8nResponse = await this.n8nService.triggerWebhook(tenantId, {
                                    type: 'instagram.message',
                                    sender_id: senderId,
                                    content,
                                    contact_id: contact.id,
                                    name: contact.name,
                                    message_id: message.id,
                                    provider: 'instagram',
                                }, null);

                                if (n8nResponse) {
                                    const resBuffer = Array.isArray(n8nResponse) ? n8nResponse : [n8nResponse];
                                    for (const r of resBuffer) {
                                        let replyText = r.output || (typeof r.message === 'object' ? r.message.text : null) || r.textMessage || r.text || r.message;
                                        if (replyText && typeof replyText !== 'string') replyText = JSON.stringify(replyText);

                                        if (replyText) {
                                            try {
                                                this.logger.log(`[INSTAGRAM_WEBHOOK] Sending N8N reply (First 50 chars): ${replyText.substring(0, 50)}...`);
                                                await this.metaApiService.sendInstagramMessage(tenantId, senderId, replyText, pageId);
                                            } catch (sendErr: any) {
                                                this.logger.error(`[INSTAGRAM_WEBHOOK] Failed to send N8N reply: ${sendErr.message}`);
                                            }
                                        }
                                    }
                                }
                            } else if (contact.aiEnabled !== false) {
                                try {
                                    const shouldRespond = await this.aiService.shouldRespond(contact, pageId, tenantId);
                                    if (shouldRespond) {
                                        const aiResp = await this.aiService.generateResponse(contact, content, tenantId, pageId);
                                        if (aiResp) {
                                            await this.metaApiService.sendInstagramMessage(tenantId, senderId, aiResp, pageId);
                                        }
                                    }
                                } catch (aiErr: any) {
                                    this.logger.warn(`[INSTAGRAM_WEBHOOK] AI response failed: ${aiErr.message}`);
                                }
                            }
                        }
                    }

                    // --- Comments / Mentions (pass to N8N) ---
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.field === 'comments' || change.field === 'mentions') {
                                const value = change.value;
                                this.logger.log(`[INSTAGRAM_WEBHOOK] ${change.field} event from ${value.from?.id}`);
                                await this.n8nService.triggerWebhook(tenantId, {
                                    type: `instagram.${change.field}`,
                                    from: value.from,
                                    content: value.text,
                                    media_id: value.media_id,
                                    comment_id: value.id,
                                }, null);
                            }
                        }
                    }
                }
            } catch (e: any) {
                this.logger.error(`[INSTAGRAM_WEBHOOK] Fatal error processing payload: ${e.message}`, e.stack);
            }
        }
    }

    @Post('evolution')
    @HttpCode(HttpStatus.OK)
    async handleEvolution(@Body() payload: any) {
        const { event: eventType, instance, data } = payload;
        this.logger.log(`[EVOLUTION_WEBHOOK_RAW] Event: ${eventType}, Instance: ${typeof instance === 'string' ? instance : instance?.instanceName}`);

        let tenantId = 'default';
        let instanceName = typeof instance === 'string' ? instance : (instance?.instanceName || instance?.name || '');

        // 1. Resolve Integration & Tenant
        const existingIntegration = await this.integrationRepository.createQueryBuilder('i')
            .where(`(i.settings->>'instanceName' = :instanceName OR i.credentials->>'instanceName' = :instanceName OR i.credentials->>'name' = :instanceName)`, { instanceName })
            .getOne();

        if (existingIntegration) {
            tenantId = existingIntegration.tenantId;
            this.logger.debug(`[EVOLUTION_WEBHOOK] Found integration. Tenant identified: ${tenantId}`);
        } else {
            // Fallback for dynamic tenant identification from instance name prefix
            const uuidMatch = instanceName.match(/tenant_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
            if (uuidMatch) {
                tenantId = uuidMatch[1];
                this.logger.debug(`[EVOLUTION_WEBHOOK] No integration object found, but Tenant identified by prefix: ${tenantId}`);
            } else {
                this.logger.warn(`[EVOLUTION_WEBHOOK] Could not identify tenant for instance: ${instanceName}. Payload ignored.`);
                return { status: 'skipped_no_tenant' };
            }
        }

        const normalizedEvent = (eventType || '').toUpperCase().replace(/\./g, '_');
        
        // 2. Handle Messages
        if (normalizedEvent === 'MESSAGES_UPSERT' || normalizedEvent === 'SEND_MESSAGE') {
            const messageData = data.data || data;
            if (!messageData || !messageData.key) {
                this.logger.debug(`[EVOLUTION_WEBHOOK] Ignored event (missing message key)`);
                return { status: 'ignored' };
            }

            const isOutbound = messageData.key.fromMe === true;
            const remoteJid = messageData.key.remoteJid;
            const pushName = messageData.pushName || payload.sender || (isOutbound ? 'Sistema' : 'WhatsApp User');
            let content = '';
            const msg = messageData.message;
            
            if (msg?.conversation) content = msg.conversation;
            else if (msg?.extendedTextMessage?.text) content = msg.extendedTextMessage.text;
            else if (msg?.imageMessage?.caption) content = msg.imageMessage.caption;

            if (!content) {
                this.logger.debug(`[EVOLUTION_WEBHOOK] Received non-text message (ignored for now)`);
                return { status: 'no_content' };
            }

            const externalId = remoteJid.replace(/:[0-9]+/, '');
            const phonePart = (messageData.senderPn || externalId).split('@')[0].replace(/\D/g, '');

            try {
                this.logger.log(`[EVOLUTION_WEBHOOK] Processing message from ${pushName} (${phonePart}) for Tenant ${tenantId}`);
                
                const contact = await this.crmService.ensureContact(tenantId, {
                    name: pushName, phoneNumber: phonePart, externalId: externalId, instance: instanceName
                });
                
                const wamid = messageData.key.id;
                const exists = await this.messageRepository.findOne({ where: { wamid, contactId: contact.id } });
                if (exists) {
                    this.logger.debug(`[EVOLUTION_WEBHOOK] Duplicate message skipped (WAMID: ${wamid})`);
                    return { status: 'duplicate_skipped' };
                }

                const message = this.messageRepository.create({
                    contactId: contact.id, content, direction: isOutbound ? 'outbound' : 'inbound',
                    provider: 'whatsapp', tenantId, wamid, instance: instanceName
                });
                await this.messageRepository.save(message);

                // ✅ Emitir nova mensagem via WebSocket (Evolution)
                this.communicationService.emitToTenant(tenantId, 'new_message', {
                    ...message,
                    contact: { id: contact.id, name: contact.name }
                });
                
                // ✅ Trigger Pipeline Qualification Automation
                await this.crmService.triggerLeadQualification(tenantId, contact.id, isOutbound ? 'SENT' : 'REPLY');

                // FIX: Use update instead of save to avoid overwriting automation settings (aiEnabled/n8nEnabled) with stale data
                // 4. Record last message and update contact updatedAt for sorting
                await this.contactRepository.update(contact.id, { 
                    lastMessage: content,
                    updatedAt: new Date(),
                    provider: 'whatsapp'
                });

                // 3. n8n Dynamic Trigger - Must respect BOTH global and contact level settings
                const n8nActive = existingIntegration?.n8nEnabled === true && contact.n8nEnabled !== false;
                
                if (!isOutbound && n8nActive) {
                    this.logger.log(`[EVOLUTION_WEBHOOK] Triggering n8n for ${contact.name} (Tenant: ${tenantId})`);
                    const n8nResponse = await this.n8nService.triggerWebhook(tenantId, {
                        provider: 'evolution',
                        type: 'whatsapp.message', sender: remoteJid, content, contact_id: contact.id, name: pushName, message_id: message.id
                    }, existingIntegration);
                    
                    if (n8nResponse) {
                        const responses = Array.isArray(n8nResponse) ? n8nResponse : [n8nResponse];
                        for (const res of responses) {
                            const text = res.textMessage || res.text || res.message;
                            if (text) await this.crmService.sendMessage(tenantId, contact.id, text);
                        }
                    }
                } else if (!isOutbound && contact.aiEnabled !== false) {
                    this.logger.log(`[EVOLUTION_WEBHOOK] Triggering AI for ${contact.name} (Tenant: ${tenantId})`);
                    const shouldRespond = await this.aiService.shouldRespond(contact, instanceName, tenantId);
                    if (shouldRespond) {
                        const aiResponse = await this.aiService.generateResponse(contact, content, tenantId, instanceName);
                        if (aiResponse) await this.crmService.sendMessage(tenantId, contact.id, aiResponse);
                    }
                }
            } catch (err) { 
                this.logger.error(`[EVOLUTION_WEBHOOK_ERROR] Error processing WhatsApp message: ${err.message}`, err.stack); 
            }
        } else if (normalizedEvent === 'MESSAGES_UPDATE') {
            const eventData = data.data || data;
            if (eventData && eventData.id) {
                const message = await this.messageRepository.findOne({ where: { wamid: eventData.id } });
                if (message && eventData.status) {
                     message.status = eventData.status;
                    await this.messageRepository.save(message);

                    // ✅ Emitir atualização de status via WebSocket (Evolution)
                    this.communicationService.emitToTenant(tenantId, 'message_status', {
                        messageId: message.id,
                        status: eventData.status
                    });
                }
            }
        }
        return { status: 'received' };
    }

    @Post('n8n/response')
    @UseGuards(UniversalAuthGuard)
    @HttpCode(HttpStatus.OK)
    async handleN8nResponse(@Body() payload: { tenantId: string; contactId: string; content: string; instanceName?: string }) {
        const { tenantId, contactId, content, instanceName } = payload;
        try {
            const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
            if (!contact) return { success: false, error: 'Contact not found' };
            const useInstance = instanceName || contact.instance;
            if (!useInstance) return { success: false, error: 'Instance not found' };

            const message = this.messageRepository.create({
                tenantId, contactId: contact.id, content, direction: 'outbound',
                provider: contact.provider as any || 'whatsapp', instance: useInstance, status: 'PENDING'
            });
            await this.messageRepository.save(message);
            await this.aiService.sendAIResponse(contact, content, tenantId, useInstance);
            return { success: true, messageId: message.id };
        } catch (error) { return { success: false, error: error.message }; }
    }
}
