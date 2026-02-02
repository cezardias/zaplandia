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
                this.logger.log(`Checking instance: ${name}, Match: ${match}`);
                return match;
            });

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

                        // Fire and forget webhook set to avoid latency
                        this.setWebhook(tenantId, name, webhookUrl).catch(err =>
                            this.logger.warn(`Failed to auto-set webhook for ${name}: ${err.message}. Ensure containers are on the same network or use a public URL.`)
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

    async sendText(tenantId: string, instanceName: string, number: string, text: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            // Evolution v2 requires 'textMessage' object, while v1 uses 'text'.
            // We send both for maximum compatibility.
            // HARDENING: Ensure number has suffix
            const cleanNumber = number.replace(/\D/g, '');
            const finalNumber = number.includes('@') ? number : `${cleanNumber}@s.whatsapp.net`;

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
        } catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao enviar mensagem texto via EvolutionAPI: ${JSON.stringify(errorData)}`);
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

