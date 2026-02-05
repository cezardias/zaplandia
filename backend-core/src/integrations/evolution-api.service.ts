import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import axios from 'axios';

@Injectable()
export class EvolutionApiService {
    private readonly logger = new Logger(EvolutionApiService.name);

    constructor(private readonly integrationsService: IntegrationsService) { }

    private async getBaseUrl(tenantId: string) {
        return await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_URL');
    }

    private async getApiKey(tenantId: string) {
        return await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_KEY');
    }

    async listInstances(tenantId: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada.');
        }

        try {
            const response = await axios.get(`${baseUrl}/instance/fetchInstances`, {
                headers: { 'apikey': apiKey }
            });

            this.logger.log(`Raw instances from EvolutionAPI: ${JSON.stringify(response.data)}`);

            // Filter instances that belong to this tenant (prefix: tenant_<tenantId>_)
            const allInstances = Array.isArray(response.data) ? response.data : [];

            this.logger.log(`Filtering for tenantId: ${tenantId}`);

            const tenantInstances = allInstances.filter((inst: any) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName || '';
                const match = name.startsWith(`tenant_${tenantId}_`);
                return match;
            });

            this.logger.log(`[SECURITY] Tenant ${tenantId}: Returning ${tenantInstances.length}/${allInstances.length} instances (filtered by tenant prefix)`);

            // Enrich instances with real-time status
            const enrichedInstances = await Promise.all(tenantInstances.map(async (inst: any) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName;
                try {
                    const statusRes = await axios.get(`${baseUrl}/instance/connectionState/${name}`, {
                        headers: { 'apikey': apiKey }
                    });

                    // Auto-configure Webhook if connected
                    if (statusRes.data?.instance?.state === 'open') {
                        // Use internal URL for webhooks so Evolution can reach backend-core inside docker
                        // Correct port is 3001 based on main.ts and docker-compose.yml
                        // Using 'host.docker.internal' as a common alias for the host machine if 'backend-core' fails
                        const webhookUrl = process.env.INTERNAL_WEBHOOK_URL || 'http://backend-core:3001/webhooks/evolution';

                        this.logger.log(`Auto-configuring webhook for ${name} to ${webhookUrl}`);

                        this.setWebhook(tenantId, name, webhookUrl).catch(err =>
                            this.logger.warn(`Failed to auto-set webhook for ${name}: ${err.message}. Ensure containers are on the same network or use a public URL.`)
                        );

                        // Auto-configure Settings (Global Config)
                        this.setSettings(tenantId, name).catch(err =>
                            this.logger.warn(`Failed to auto-set settings for ${name}: ${err.message}`)
                        );
                    }

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
        } catch (error) {
            this.logger.error(`Erro ao listar instâncias: ${error.message}`);
            throw error;
        }
    }

    async getInstanceStatus(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const response = await axios.get(`${baseUrl}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao verificar status da instância: ${error.message}`);
            throw error;
        }
    }

    async createInstance(tenantId: string, instanceName: string, userId: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada para este tenant.');
        }

        try {
            const response = await axios.post(`${baseUrl}/instance/create`, {
                instanceName,
                token: instanceName,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            }, {
                headers: { 'apikey': apiKey }
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
            const response = await axios.get(`${baseUrl}/instance/connect/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            this.logger.log(`QR Code response for ${instanceName}: ${JSON.stringify(response.data)}`);
            this.logger.log(`QR Code response for ${instanceName}: ${JSON.stringify(response.data)}`);

            // Check if response contains valid QR code data
            let data = response.data;
            if (!data || (!data.code && !data.pairingCode && !data.base64 && (data.status !== 'open' && data.status !== 'connected'))) {
                this.logger.warn(`Invalid QR Code response: ${JSON.stringify(data)}. Attempting to reset instance...`);

                // Try to logout/reset the instance and retry
                try {
                    await axios.delete(`${baseUrl}/instance/logout/${instanceName}`, { headers: { 'apikey': apiKey } });
                    this.logger.log(`Instance ${instanceName} logged out. Retrying connect...`);
                    // Wait 3 seconds
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const retryResponse = await axios.get(`${baseUrl}/instance/connect/${instanceName}`, {
                        headers: { 'apikey': apiKey }
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
            const response = await axios.delete(`${baseUrl}/instance/logout/${instanceName}`, {
                headers: { 'apikey': apiKey }
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
            const response = await axios.delete(`${baseUrl}/instance/delete/${instanceName}`, {
                headers: { 'apikey': apiKey }
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

        try {
            const payload = {
                url: webhookUrl,
                enabled: true,
                webhook_by_events: false, // Use flat events list
                webhook_by_instance: false,
                events: [
                    "MESSAGES_UPSERT",
                    "MESSAGES_UPDATE",
                    "MESSAGES_DELETE",
                    "SEND_MESSAGE",
                    "CONNECTION_UPDATE",
                    "CALL"
                ]
            };
            this.logger.log(`Setting webhook for ${instanceName} to ${webhookUrl}. Payload: ${JSON.stringify(payload)}`);

            const response = await axios.post(`${baseUrl}/webhook/set/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao configurar webhook no EvolutionAPI: ${JSON.stringify(errorData)}`);
            throw error;
        }
    }

    async setSettings(tenantId: string, instanceName: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const payload = {
                reject_call: false,
                groups_ignore: true, // IMPORTANT: Ignore groups to avoid inbox pollution
                always_online: true,
                read_messages: false,
                read_status: false,
                sync_full_history: false // Required by Evolution API v2
            };
            this.logger.log(`Setting settings for ${instanceName}. Payload: ${JSON.stringify(payload)}`);

            const response = await axios.post(`${baseUrl}/settings/set/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao configurar settings no EvolutionAPI: ${JSON.stringify(errorData)}`);
            // Don't throw, just log. Settings are optional.
            return null;
        }
    }

    async sendText(tenantId: string, instanceName: string, number: string, text: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        const sendRequest = async (targetNumber: string) => {
            // Evolution v2 requires 'textMessage' object, while v1 uses 'text'.
            // We send both for maximum compatibility.
            // HARDENING: Standardize to base phone number (remove :device but keep @suffix)
            const cleanNumber = targetNumber.replace(/:[0-9]+/, '');
            const finalNumber = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber.replace(/\D/g, '')}@s.whatsapp.net`;

            const payload = {
                number: finalNumber,
                text: text,
                textMessage: {
                    text: text
                },
                delay: 1200,
                linkPreview: true
            };

            this.logger.log(`Sending message to ${finalNumber} via ${instanceName}. Payload: ${JSON.stringify(payload)}`);

            const response = await axios.post(`${baseUrl}/message/sendText/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });
            this.logger.log(`Message sent result: ${JSON.stringify(response.data)}`);
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
                mediatype: media.type, // image, video, document
                mimetype: media.mimetype,
                caption: media.caption || '',
                media: media.base64, // Evolution accepts Base64 here
                fileName: media.fileName || 'file'
            };

            this.logger.log(`Sending MEDIA to ${finalNumber} via ${instanceName}. Type: ${media.type}`);

            const response = await axios.post(`${baseUrl}/message/sendMedia/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });

            this.logger.log(`Media sent result: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao enviar MEDIA via EvolutionAPI: ${JSON.stringify(errorData)}`);
            throw error;
        }
    }
}

