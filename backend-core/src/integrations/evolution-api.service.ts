import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';
import { IsNull } from 'typeorm';

@Injectable()
export class EvolutionApiService {
    private readonly logger = new Logger(EvolutionApiService.name);

    constructor(private readonly integrationsService: IntegrationsService) { }

    async getBaseUrl(tenantId: string): Promise<string | null> {
        const url = await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_URL');
        if (!url) {
            console.error(`[EVOLUTION_API] No URL found for tenant ${tenantId}`);
            return null;
        }
        return url.replace(/\/$/, '').trim();
    }

    async getApiKey(tenantId: string): Promise<string | null> {
        const key = await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_KEY');
        if (!key) {
            console.error(`[EVOLUTION_API] No API Key found for tenant ${tenantId}`);
            return null;
        }
        return key.trim();
    }

    async listInstances(tenantId: string, role?: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada.');
        }

        try {
            const url = `${baseUrl}/instance/fetchInstances`;
            this.logger.debug(`[EvolutionAPI] Calling GET: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'apikey': apiKey,
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });

            this.logger.log(`Raw instances from EvolutionAPI: ${JSON.stringify(response.data)}`);

            const allInstances = Array.isArray(response.data) ? response.data : [];

            let tenantInstances: any[] = [];

            if (role === 'superadmin') {
                this.logger.log(`[SECURITY] User is superadmin. Showing ALL instances.`);
                tenantInstances = allInstances;
            } else {
                this.logger.log(`Filtering for tenantId: ${tenantId}`);
                tenantInstances = allInstances.filter((inst: any) => {
                    const name = inst.name || inst.instance?.instanceName || inst.instanceName || '';
                    const match = name.startsWith(`tenant_${tenantId}_`);
                    return match;
                });
            }

            this.logger.log(`[SECURITY] Tenant ${tenantId}: Returning ${tenantInstances.length}/${allInstances.length} instances (filtered by tenant prefix)`);

            // Enrich instances with real-time status
            const enrichedInstances = await Promise.all(tenantInstances.map(async (inst: any) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName;
                try {
                    const statusRes = await axios.get(`${baseUrl}/instance/connectionState/${name}`, {
                        headers: {
                            'apikey': apiKey,
                            'User-Agent': 'ZaplandiaCore/1.0'
                        }
                    });

                    // Merge status into instance object
                    if (statusRes.data && statusRes.data.instance) {
                        // Evolution usually returns { instance: { state: 'open' } }
                        return { ...inst, ...statusRes.data.instance, status: statusRes.data.instance.state };
                    }
                    return inst;
                } catch (e) {
                    this.logger.warn(`Failed to fetch status for ${name}: ${e.message}`);
                    return inst;
                }
            }));

            return enrichedInstances;
        } catch (error: any) {
            const status = error.response?.status;
            const data = JSON.stringify(error.response?.data || error.message);
            this.logger.error(`Erro ao listar instâncias: ${status} - ${data}`);
            throw error;
        }
    }

    // Extract tenantId from instance name (format: tenant_<uuid>_<name>)
    private extractTenantId(instanceName: string): string | null {
        const match = instanceName.match(/^tenant_([0-9a-fA-F-]{36})_/);
        return match ? match[1] : null;
    }

    // SuperAdmin: List ALL instances from ALL tenants
    async listAllInstances() {
        // Use any tenant to get base credentials (they're global now)
        const baseUrl = await this.getBaseUrl(null as any) || await this.integrationsService.getCredential(null as any, 'EVOLUTION_API_URL');
        const apiKey = await this.getApiKey(null as any) || await this.integrationsService.getCredential(null as any, 'EVOLUTION_API_KEY');

        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada.');
        }

        try {
            const url = `${baseUrl}/instance/fetchInstances`;
            this.logger.debug(`[EvolutionAPI] Calling GET: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'apikey': apiKey,
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });

            const allInstances = Array.isArray(response.data) ? response.data : [];
            this.logger.log(`[SUPERADMIN] Found ${allInstances.length} total instances`);

            // Enrich each instance with tenant/user info
            const enrichedInstances = await Promise.all(allInstances.map(async (inst: any) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName || '';
                const tenantId = this.extractTenantId(name);

                // Fetch real-time status
                try {
                    const statusRes = await axios.get(`${baseUrl}/instance/connectionState/${name}`, {
                        headers: {
                            'apikey': apiKey,
                            'User-Agent': 'ZaplandiaCore/1.0'
                        }
                    });

                    const enriched = {
                        ...inst,
                        ...(statusRes.data?.instance || {}),
                        status: statusRes.data?.instance?.state || inst.status,
                        tenantId,
                        instanceName: name
                    };

                    return enriched;
                } catch (e) {
                    this.logger.warn(`Failed to fetch status for ${name}: ${e.message}`);
                    return { ...inst, tenantId, instanceName: name };
                }
            }));

            return enrichedInstances;
        } catch (error) {
            this.logger.error(`Erro ao listar todas as instâncias: ${error.message}`);
            throw error;
        }
    }

    async getInstanceStatus(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const url = `${baseUrl}/instance/connectionState/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] GET status: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'apikey': apiKey,
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao verificar status da instância: ${error.message}`);
            throw error;
        }
    }

    async createInstance(tenantId: string, instanceName: string, userId: string, webhookUrl?: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada para este tenant.');
        }

        try {
            const url = `${baseUrl}/instance/create`;
            this.logger.debug(`[EvolutionAPI] POST create: ${url}`);

            const payload: any = {
                instanceName,
                token: instanceName,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS",
                // --- INTEGRATED V2 PAYLOAD ---
                settings: {
                    reject_call: false,
                    groups_ignore: true,
                    always_online: true,
                    read_messages: false,
                    read_status: false,
                    sync_full_history: false,
                    webhook_base64: true
                }
            };

            if (webhookUrl) {
                payload.webhook = {
                    url: webhookUrl,
                    enabled: true,
                    webhook_by_events: true,
                    webhook_base64: true,
                    events: [
                        "MESSAGES_UPSERT",
                        "MESSAGES_UPDATE",
                        "MESSAGES_DELETE",
                        "SEND_MESSAGE",
                        "CONNECTION_UPDATE",
                        "CALL",
                        "PRESENCE_UPDATE",
                        "QRCODE_UPDATED",
                        "CHATS_UPSERT",
                        "CHATS_UPDATE",
                        "CHATS_DELETE",
                        "CONTACTS_UPSERT",
                        "CONTACTS_UPDATE",
                        "GROUP_PARTICIPANTS_UPDATE",
                        "GROUP_UPDATE",
                        "GROUPS_UPSERT"
                    ]
                };
            }

            const response = await axios.post(url, payload, {
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });

            this.logger.log(`Instance created successfully: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao criar instância no EvolutionAPI: ${error.message}`);
            if (error.response) {
                this.logger.error(`Create Error details: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    async getQrCode(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const url = `${baseUrl}/instance/connect/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] GET connect/qr: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'apikey': apiKey,
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            this.logger.log(`QR Code response for ${instanceName}: ${JSON.stringify(response.data)}`);

            // Check if response contains valid QR code data
            let data = response.data;
            if (!data || (!data.code && !data.pairingCode && !data.base64 && (data.status !== 'open' && data.status !== 'connected'))) {
                this.logger.warn(`Invalid QR Code response: ${JSON.stringify(data)}. Attempting to reset instance...`);

                // Try to logout/reset the instance and retry
                try {
                    await axios.delete(`${baseUrl}/instance/logout/${instanceName}`, {
                        headers: {
                            'apikey': apiKey,
                            'User-Agent': 'ZaplandiaCore/1.0'
                        }
                    });
                    this.logger.log(`Instance ${instanceName} logged out. Retrying connect...`);
                    // Wait 3 seconds
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const retryUrl = `${baseUrl}/instance/connect/${instanceName}`;
                    const retryResponse = await axios.get(retryUrl, {
                        headers: {
                            'apikey': apiKey,
                            'User-Agent': 'ZaplandiaCore/1.0'
                        }
                    });
                    this.logger.log(`Retry QR Code response for ${instanceName}: ${JSON.stringify(retryResponse.data)}`);
                    data = retryResponse.data;

                    if (!data || (!data.code && !data.pairingCode && !data.base64 && (data.status !== 'open' && data.status !== 'connected'))) {
                        throw new Error('Falha persistente ao obter QR Code');
                    }
                } catch (retryError) {
                    this.logger.error(`Retry failed: ${retryError.message}`);
                    throw new Error('Falha ao obter QR Code da EvolutionAPI (mesmo após reset). A EvolutionAPI pode estar instável ou a instância travada. Tente excluir e recriar.');
                }
            }

            return data;
        } catch (error) {
            this.logger.error(`Erro ao buscar QR Code no EvolutionAPI: ${error.message}`);
            if (error.response) {
                this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    async logoutInstance(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const url = `${baseUrl}/instance/logout/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] DELETE logout: ${url}`);
            const response = await axios.delete(url, {
                headers: {
                    'apikey': apiKey,
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao fazer logout no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }

    async deleteInstance(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const url = `${baseUrl}/instance/delete/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] DELETE delete: ${url}`);
            const response = await axios.delete(url, {
                headers: {
                    'apikey': apiKey,
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao deletar instância no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }

    async setWebhook(tenantId: string, instanceName: string, webhookUrl: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        const payload = {
            url: webhookUrl,
            enabled: true,
            webhook_by_events: true,
            webhook_base64: true,
            events: [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "MESSAGES_DELETE",
                "SEND_MESSAGE",
                "CONNECTION_UPDATE",
                "CALL",
                "PRESENCE_UPDATE",
                "QRCODE_UPDATED",
                "CHATS_UPSERT",
                "CHATS_UPDATE",
                "CHATS_DELETE",
                "CONTACTS_UPSERT",
                "CONTACTS_UPDATE",
                "GROUP_PARTICIPANTS_UPDATE",
                "GROUP_UPDATE",
                "GROUPS_UPSERT"
            ]
        };

        try {
            const url = `${baseUrl}/webhook/instance/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] POST webhook (V2): ${url}`);
            const response = await axios.post(url, payload, {
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            return response.data;
        } catch (error) {
            // Fallback for older versions just in case
            try {
                const legacyUrl = `${baseUrl}/webhook/set/${instanceName}`;
                this.logger.debug(`[EvolutionAPI] Retrying with legacy webhook URL: ${legacyUrl}`);
                const payloadLegacy = { ...payload, webhook_by_events: false, webhook_by_instance: false };
                const response = await axios.post(legacyUrl, payloadLegacy, {
                    headers: {
                        'apikey': apiKey,
                        'Content-Type': 'application/json',
                        'User-Agent': 'ZaplandiaCore/1.0'
                    }
                });
                return response.data;
            } catch (legacyError) {
                const errorData = error.response?.data || error.message;
                this.logger.error(`Erro ao configurar webhook no EvolutionAPI: ${JSON.stringify(errorData)}`);
                throw error;
            }
        }
    }

    async getWebhook(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const url = `${baseUrl}/webhook/find/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] GET webhook info: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'apikey': apiKey,
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao buscar webhook no EvolutionAPI: ${JSON.stringify(errorData)}`);
            throw error;
        }
    }

    /**
     * Resolve a @lid JID to a real phone @s.whatsapp.net JID.
     * WhatsApp Multi-Device sends @lid for linked-device contacts.
     * Returns null if resolution fails.
     */
    async resolveLid(tenantId: string, instanceName: string, lidJid: string): Promise<string | null> {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) return null;
        const headers = { 'apikey': apiKey, 'Content-Type': 'application/json' };

        // Strategy 1: V2 GET /chat/fetchProfile/{instance}?number={lid}
        // fetchProfile often automatically resolves JIDs and returns the real number/JID
        try {
            const url = `${baseUrl}/chat/fetchProfile/${instanceName}?number=${encodeURIComponent(lidJid)}`;
            this.logger.debug(`[LID_RESOLVE] Strategy 1 (V2): GET fetchProfile for ${lidJid}`);
            const response = await axios.get(url, { headers });
            const data = response.data;
            // Response often contains { jid, number, ... }
            const realJid = data?.jid || data?.number || data?.id;

            if (realJid && !realJid.includes('@lid')) {
                const jidWithSuffix = realJid.includes('@') ? realJid : `${realJid.replace(/\D/g, '')}@s.whatsapp.net`;
                this.logger.log(`[LID_RESOLVE] Strategy 1 success: ${lidJid} -> ${jidWithSuffix}`);
                return jidWithSuffix;
            }
        } catch (e1) {
            this.logger.debug(`[LID_RESOLVE] Strategy 1 failed: ${e1.message}`);
        }

        // Strategy 2: V2 GET /chat/fetchContacts/{instance} (Global list under /chat/)
        try {
            const url = `${baseUrl}/chat/fetchContacts/${instanceName}`;
            this.logger.debug(`[LID_RESOLVE] Strategy 2 (V2): GET fetchContacts (local filter) for ${lidJid}`);
            const response = await axios.get(url, { headers });
            const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);

            const match = list.find((c: any) =>
                c.id === lidJid || c.jid === lidJid || c.lid === lidJid || c.remoteJid === lidJid
            );

            if (match) {
                const rawJid = match?.number || match?.phoneNumber || match?.remoteJid || match?.jid;
                if (rawJid && !rawJid.includes('@lid')) {
                    const realJid = rawJid.includes('@') ? rawJid : `${rawJid.replace(/\D/g, '')}@s.whatsapp.net`;
                    this.logger.log(`[LID_RESOLVE] Strategy 2 success: ${lidJid} -> ${realJid}`);
                    return realJid;
                }
            }
        } catch (e2) {
            this.logger.debug(`[LID_RESOLVE] Strategy 2 failed: ${e2.message}`);
        }

        // Strategy 3: V2 POST /chat/findContacts/{instance} (Search with where ID)
        try {
            const url = `${baseUrl}/chat/findContacts/${instanceName}`;
            this.logger.debug(`[LID_RESOLVE] Strategy 3 (V2): POST findContacts for ${lidJid}`);
            const response = await axios.post(url, { where: { id: lidJid } }, { headers });
            const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            const match = list.find((c: any) => c.id === lidJid || c.jid === lidJid);
            const rawJid = match?.number || match?.remoteJid || match?.jid;
            if (rawJid && !rawJid.includes('@lid')) {
                const realJid = rawJid.includes('@') ? rawJid : `${rawJid.replace(/\D/g, '')}@s.whatsapp.net`;
                this.logger.log(`[LID_RESOLVE] Strategy 3 success: ${lidJid} -> ${realJid}`);
                return realJid;
            }
        } catch (e3) {
            this.logger.debug(`[LID_RESOLVE] Strategy 3 failed: ${e3.message}`);
        }

        // Strategy 4: Fallback checks for /contact/ endpoints
        try {
            const url = `${baseUrl}/contact/fetchContact/${instanceName}?number=${encodeURIComponent(lidJid)}`;
            this.logger.debug(`[LID_RESOLVE] Strategy 4 (V2): GET contact/fetchContact for ${lidJid}`);
            const response = await axios.get(url, { headers });
            const match = response.data?.contact || response.data;
            const realJid = match?.number || match?.jid;
            if (realJid && !realJid.includes('@lid')) {
                const jidWithSuffix = realJid.includes('@') ? realJid : `${realJid.replace(/\D/g, '')}@s.whatsapp.net`;
                this.logger.log(`[LID_RESOLVE] Strategy 4 success: ${lidJid} -> ${jidWithSuffix}`);
                return jidWithSuffix;
            }
        } catch (e4) {
            this.logger.debug(`[LID_RESOLVE] Strategy 4 failed: ${e4.message}`);
        }

        this.logger.warn(`[LID_RESOLVE] All V2 strategies failed for ${lidJid}. Check EvolutionAPI STORE_CONTACTS=true.`);
        return null;
    }

    async setSettings(tenantId: string, instanceName: string) {

        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const payload = {
                reject_call: false,
                groups_ignore: true,
                always_online: true,
                read_messages: false,
                read_status: false,
                sync_full_history: false,
                webhook_base64: true
            };
            const url = `${baseUrl}/settings/set/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] POST settings: ${url}`);
            const response = await axios.post(url, payload, {
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao configurar settings no EvolutionAPI: ${JSON.stringify(errorData)}`);
            return null;
        }
    }

    async sendText(tenantId: string, instanceName: string, number: string, text: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        const sendRequest = async (targetNumber: string) => {
            const cleanNumber = targetNumber.replace(/:[0-9]+/, '');
            const finalNumber = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber.replace(/\D/g, '')}@s.whatsapp.net`;

            const payload = {
                number: finalNumber,
                text: text,
                textMessage: { text: text },
                delay: 1200,
                linkPreview: true
            };

            const url = `${baseUrl}/message/sendText/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] POST sendText: ${url}`);
            const response = await axios.post(url, payload, {
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });
            return response.data;
        }

        try {
            return await sendRequest(number);
        } catch (error: any) {
            const errorData = error.response?.data || error.message;
            const errorString = JSON.stringify(errorData);

            // BRAZIL 9-DIGIT RETRY LOGIC
            // Check if error is specifically "exists: false"
            const isExistsError = errorString.includes('"exists":false') || errorString.includes('not found');
            const cleanNum = number.replace(/\D/g, '');

            // @lid: do NOT skip silently - log and rethrow so ai.service.ts fallback logic handles it
            // Some newer Evolution API versions support direct @lid send, so we let it propagate
            if (isExistsError && number.includes('@lid')) {
                this.logger.warn(`[EvolutionAPI] sendText to @lid ${number} failed (exists:false). If STORE_CONTACTS=true is set in EvolutionAPI .env, resolveLid should have resolved this before reaching here.`);
                // Rethrow as a clear error for the caller
                throw new Error(`LID_NOT_RESOLVED: Cannot send to @lid JID ${number}. Enable STORE_CONTACTS=true in EvolutionAPI .env.`);
            }

            if (isExistsError && cleanNum.startsWith('55')) {

                let retryNum = '';

                // Case 1: Has 13 digits (55 + 2 DDD + 9 + 8 digits) -> Try REMOVING 9
                // Example: 55 61 9 98655077 -> 55 61 98655077
                if (cleanNum.length === 13 && cleanNum[4] === '9') {
                    retryNum = cleanNum.slice(0, 4) + cleanNum.slice(5);
                }
                // Case 2: Has 12 digits (55 + 2 DDD + 8 digits) -> Try ADDING 9
                // ONLY for mobile candidates (Starts with 6, 7, 8, 9). 
                // Landlines (2, 3, 4, 5) DON'T get the 9th digit in Brazil.
                else if (cleanNum.length === 12) {
                    const firstDigitOfNumber = cleanNum[4];
                    if (['6', '7', '8', '9'].includes(firstDigitOfNumber)) {
                        this.logger.debug(`[EvolutionAPI] Number ${cleanNum} looks like a mobile missing the 9. Retrying...`);
                        retryNum = cleanNum.slice(0, 4) + '9' + cleanNum.slice(4);
                    } else {
                        this.logger.warn(`[EvolutionAPI] Number ${cleanNum} failed existence check. It looks like a landline, skipping 9-digit retry.`);
                    }
                }
                // Case 3: Has 14 digits - common import error (e.g., extra 9 after DDD + trailing 0)
                // Example: 55629819800180 → correct is 556281980018 (remove 9@pos4 + last digit)
                else if (cleanNum.length === 14) {
                    const isExists = (e: any) => {
                        const s = JSON.stringify(e?.response?.data || e?.message || '');
                        return s.includes('"exists":false') || s.includes('not found') || s.includes('does not exist');
                    };

                    // Strategy A: remove last digit → 13 digits (keep 9 after DDD)
                    const strategy_a = cleanNum.slice(0, 13);
                    this.logger.log(`[EvolutionAPI] 14-digit ${cleanNum} → Strategy A (remove last): ${strategy_a}`);
                    try { return await sendRequest(strategy_a); } catch (e14a: any) {
                        if (!isExists(e14a)) throw e14a;
                    }

                    // Strategy B: remove 9 after DDD → 13 digits (keep last digit)
                    if (cleanNum[4] === '9') {
                        const strategy_b = cleanNum.slice(0, 4) + cleanNum.slice(5);
                        this.logger.log(`[EvolutionAPI] 14-digit ${cleanNum} → Strategy B (remove 9@DDD): ${strategy_b}`);
                        try { return await sendRequest(strategy_b); } catch (e14b: any) {
                            if (!isExists(e14b)) throw e14b;
                        }

                        // Strategy C: remove 9 after DDD + remove last digit → 12 digits (clean old format)
                        const strategy_c = cleanNum.slice(0, 4) + cleanNum.slice(5, 13);
                        this.logger.log(`[EvolutionAPI] 14-digit ${cleanNum} → Strategy C (remove 9@DDD + last): ${strategy_c}`);
                        try { return await sendRequest(strategy_c); } catch (e14c: any) {
                            if (!isExists(e14c)) throw e14c;
                        }
                    }

                    this.logger.error(`[EvolutionAPI] All 14-digit strategies failed for ${cleanNum}`);
                    throw new Error(`WhatsApp number does not exist: ${cleanNum}`);
                }

                if (retryNum) {
                    this.logger.log(`Retrying send with adjusted number: ${retryNum}`);
                    try {
                        return await sendRequest(retryNum);
                    } catch (retryError: any) {
                        const retryErrorData = retryError.response?.data || retryError.message;
                        this.logger.error(`Retry failed for ${retryNum}: ${JSON.stringify(retryErrorData)}`);
                        // Explicitly label the error for the caller
                        if (JSON.stringify(retryErrorData).includes('"exists":false')) {
                            throw new Error(`WhatsApp number does not exist (even after 9-digit fix): ${retryNum}`);
                        }
                    }
                } else if (isExistsError) {
                    // It's a landline (or 13 digits already) and failed. Mark as non-existent.
                    throw new Error(`WhatsApp number does not exist: ${cleanNum}`);
                }
            }

            this.logger.error(`Erro ao enviar mensagem texto via EvolutionAPI: ${errorString}`);
            throw error;
        }
    }

    async sendMedia(tenantId: string, instanceName: string, number: string, media: { type: string, mimetype: string, base64: string, fileName?: string, caption?: string }) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            // HARDENING: Ensure number has suffix
            const cleanNumber = number.replace(/\D/g, '');
            const finalNumber = number.includes('@') ? number : `${cleanNumber}@s.whatsapp.net`;

            const payload = {
                number: finalNumber,
                mediatype: media.type,
                mimetype: media.mimetype,
                caption: media.caption || '',
                media: media.base64,
                fileName: media.fileName || 'file'
            };

            const url = `${baseUrl}/message/sendMedia/${instanceName}`;
            this.logger.debug(`[EvolutionAPI] POST sendMedia: ${url}`);
            const response = await axios.post(url, payload, {
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ZaplandiaCore/1.0'
                }
            });

            this.logger.log(`Media sent result: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error: any) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao enviar MEDIA via EvolutionAPI: ${JSON.stringify(errorData)}`);
            throw error;
        }
    }
}

