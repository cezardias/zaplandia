"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EvolutionApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionApiService = void 0;
const common_1 = require("@nestjs/common");
const integrations_service_1 = require("./integrations.service");
const axios_1 = __importDefault(require("axios"));
let EvolutionApiService = EvolutionApiService_1 = class EvolutionApiService {
    integrationsService;
    logger = new common_1.Logger(EvolutionApiService_1.name);
    constructor(integrationsService) {
        this.integrationsService = integrationsService;
    }
    async getBaseUrl(tenantId) {
        return await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_URL');
    }
    async getApiKey(tenantId) {
        return await this.integrationsService.getCredential(tenantId, 'EVOLUTION_API_KEY');
    }
    async listInstances(tenantId) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada.');
        }
        try {
            const response = await axios_1.default.get(`${baseUrl}/instance/fetchInstances`, {
                headers: { 'apikey': apiKey }
            });
            this.logger.log(`Raw instances from EvolutionAPI: ${JSON.stringify(response.data)}`);
            const allInstances = Array.isArray(response.data) ? response.data : [];
            this.logger.log(`Filtering for tenantId: ${tenantId}`);
            const tenantInstances = allInstances.filter((inst) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName || '';
                const match = name.startsWith(`tenant_${tenantId}_`);
                this.logger.log(`Checking instance: ${name}, Match: ${match}`);
                return match;
            });
            const enrichedInstances = await Promise.all(tenantInstances.map(async (inst) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName;
                try {
                    const statusRes = await axios_1.default.get(`${baseUrl}/instance/connectionState/${name}`, {
                        headers: { 'apikey': apiKey }
                    });
                    if (statusRes.data && statusRes.data.instance) {
                        return { ...inst, ...statusRes.data.instance, status: statusRes.data.instance.state };
                    }
                    return inst;
                }
                catch (e) {
                    this.logger.warn(`Failed to fetch status for ${name}: ${e.message}`);
                    return inst;
                }
            }));
            return enrichedInstances;
        }
        catch (error) {
            this.logger.error(`Erro ao listar instâncias: ${error.message}`);
            throw error;
        }
    }
    async getInstanceStatus(tenantId, instanceName) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
            const response = await axios_1.default.get(`${baseUrl}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Erro ao verificar status da instância: ${error.message}`);
            throw error;
        }
    }
    async createInstance(tenantId, instanceName, userId) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada para este tenant.');
        }
        try {
            const response = await axios_1.default.post(`${baseUrl}/instance/create`, {
                instanceName,
                token: userId,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            }, {
                headers: { 'apikey': apiKey }
            });
            this.logger.log(`Instance created successfully: ${JSON.stringify(response.data)}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Erro ao criar instância no EvolutionAPI: ${error.message}`);
            if (error.response) {
                this.logger.error(`Create Error details: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
    async getQrCode(tenantId, instanceName) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
            const response = await axios_1.default.get(`${baseUrl}/instance/connect/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            this.logger.log(`QR Code response for ${instanceName}: ${JSON.stringify(response.data)}`);
            this.logger.log(`QR Code response for ${instanceName}: ${JSON.stringify(response.data)}`);
            let data = response.data;
            if (!data || (!data.code && !data.pairingCode && !data.base64 && (data.status !== 'open' && data.status !== 'connected'))) {
                this.logger.warn(`Invalid QR Code response: ${JSON.stringify(data)}. Attempting to reset instance...`);
                try {
                    await axios_1.default.delete(`${baseUrl}/instance/logout/${instanceName}`, { headers: { 'apikey': apiKey } });
                    this.logger.log(`Instance ${instanceName} logged out. Retrying connect...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    const retryResponse = await axios_1.default.get(`${baseUrl}/instance/connect/${instanceName}`, {
                        headers: { 'apikey': apiKey }
                    });
                    this.logger.log(`Retry QR Code response for ${instanceName}: ${JSON.stringify(retryResponse.data)}`);
                    data = retryResponse.data;
                    if (!data || (!data.code && !data.pairingCode && !data.base64 && (data.status !== 'open' && data.status !== 'connected'))) {
                        throw new Error('Falha persistente ao obter QR Code');
                    }
                }
                catch (retryError) {
                    this.logger.error(`Retry failed: ${retryError.message}`);
                    throw new Error('Falha ao obter QR Code da EvolutionAPI (mesmo após reset). A EvolutionAPI pode estar instável ou a instância travada. Tente excluir e recriar.');
                }
            }
            return data;
        }
        catch (error) {
            this.logger.error(`Erro ao buscar QR Code no EvolutionAPI: ${error.message}`);
            if (error.response) {
                this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
    async logoutInstance(tenantId, instanceName) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
            const response = await axios_1.default.delete(`${baseUrl}/instance/logout/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Erro ao fazer logout no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }
    async deleteInstance(tenantId, instanceName) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
            const response = await axios_1.default.delete(`${baseUrl}/instance/delete/${instanceName}`, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Erro ao deletar instância no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }
    async setWebhook(tenantId, instanceName, webhookUrl) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
            const response = await axios_1.default.post(`${baseUrl}/webhook/set/${instanceName}`, {
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
        }
        catch (error) {
            this.logger.error(`Erro ao configurar webhook no EvolutionAPI: ${error.message}`);
            throw error;
        }
    }
    async sendText(tenantId, instanceName, number, text) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
            const response = await axios_1.default.post(`${baseUrl}/message/sendText/${instanceName}`, {
                number,
                text,
                delay: 1200,
                linkPreview: true
            }, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar mensagem texto via EvolutionAPI: ${error.message}`);
            throw error;
        }
    }
};
exports.EvolutionApiService = EvolutionApiService;
exports.EvolutionApiService = EvolutionApiService = EvolutionApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], EvolutionApiService);
//# sourceMappingURL=evolution-api.service.js.map