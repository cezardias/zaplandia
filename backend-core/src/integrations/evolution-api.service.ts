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
                        // TODO: Use correct public URL from env or config
                        const webhookUrl = `${process.env.API_URL || 'https://api.zaplandia.com.br'}/webhooks/evolution`;
                        // Fire and forget webhook set to avoid latency
                        this.setWebhook(tenantId, name, webhookUrl).catch(err =>
                            this.logger.warn(`Failed to auto-set webhook for ${name}: ${err.message}`)
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
                token: userId,
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
            this.logger.log(`Setting webhook for ${instanceName} to ${webhookUrl}`);
            const response = await axios.post(`${baseUrl}/webhook/set/${instanceName}`, {
                url: webhookUrl,
                enabled: true,
                events: [
                    "MESSAGES_UPSERT",
                    "MESSAGES_UPDATE",
                    "MESSAGES_DELETE",
                    "SEND_MESSAGE",
                    "CONTACTS_UPSERT",
                    "CONTACTS_UPDATE",
                    "PRESENCE_UPDATE",
                    "CHATS_UPSERT",
                    "CHATS_UPDATE",
                    "CHATS_DELETE",
                    "GROUPS_UPSERT",
                    "GROUPS_UPDATE",
                    "GROUP_PARTICIPANTS_UPDATE",
                    "CONNECTION_UPDATE"
                ]
            }, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao configurar webhook no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }

    async sendText(tenantId: string, instanceName: string, number: string, text: string) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);

        if (!baseUrl || !apiKey) throw new Error('EvolutionAPI não configurada.');

        try {
            const response = await axios.post(`${baseUrl}/message/sendText/${instanceName}`, {
                number,
                text,
                delay: 1200,
                linkPreview: true
            }, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Erro ao enviar mensagem texto via EvolutionAPI: ${error.message}`);
            throw error;
        }
    }
}

