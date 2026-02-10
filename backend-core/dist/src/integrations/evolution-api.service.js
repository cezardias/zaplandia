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
    async listInstances(tenantId, role) {
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
            let tenantInstances = [];
            if (role === 'superadmin') {
                this.logger.log(`[SECURITY] User is superadmin. Showing ALL instances.`);
                tenantInstances = allInstances;
            }
            else {
                this.logger.log(`Filtering for tenantId: ${tenantId}`);
                tenantInstances = allInstances.filter((inst) => {
                    const name = inst.name || inst.instance?.instanceName || inst.instanceName || '';
                    const match = name.startsWith(`tenant_${tenantId}_`);
                    return match;
                });
            }
            this.logger.log(`[SECURITY] Tenant ${tenantId}: Returning ${tenantInstances.length}/${allInstances.length} instances (filtered by tenant prefix)`);
            const enrichedInstances = await Promise.all(tenantInstances.map(async (inst) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName;
                try {
                    const statusRes = await axios_1.default.get(`${baseUrl}/instance/connectionState/${name}`, {
                        headers: { 'apikey': apiKey }
                    });
                    if (statusRes.data?.instance?.state === 'open') {
                        const webhookUrl = process.env.INTERNAL_WEBHOOK_URL || 'http://backend-core:3001/webhooks/evolution';
                        this.logger.log(`Auto-configuring webhook for ${name} to ${webhookUrl}`);
                        this.setWebhook(tenantId, name, webhookUrl).catch(err => this.logger.warn(`Failed to auto-set webhook for ${name}: ${err.message}. Ensure containers are on the same network or use a public URL.`));
                        this.setSettings(tenantId, name).catch(err => this.logger.warn(`Failed to auto-set settings for ${name}: ${err.message}`));
                    }
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
    extractTenantId(instanceName) {
        const match = instanceName.match(/^tenant_([0-9a-fA-F-]{36})_/);
        return match ? match[1] : null;
    }
    async listAllInstances() {
        const baseUrl = await this.getBaseUrl(null) || await this.integrationsService.getCredential(null, 'EVOLUTION_API_URL');
        const apiKey = await this.getApiKey(null) || await this.integrationsService.getCredential(null, 'EVOLUTION_API_KEY');
        if (!baseUrl || !apiKey) {
            throw new Error('EvolutionAPI não configurada.');
        }
        try {
            const response = await axios_1.default.get(`${baseUrl}/instance/fetchInstances`, {
                headers: { 'apikey': apiKey }
            });
            const allInstances = Array.isArray(response.data) ? response.data : [];
            this.logger.log(`[SUPERADMIN] Found ${allInstances.length} total instances`);
            const enrichedInstances = await Promise.all(allInstances.map(async (inst) => {
                const name = inst.name || inst.instance?.instanceName || inst.instanceName || '';
                const tenantId = this.extractTenantId(name);
                try {
                    const statusRes = await axios_1.default.get(`${baseUrl}/instance/connectionState/${name}`, {
                        headers: { 'apikey': apiKey }
                    });
                    const enriched = {
                        ...inst,
                        ...(statusRes.data?.instance || {}),
                        status: statusRes.data?.instance?.state || inst.status,
                        tenantId,
                        instanceName: name
                    };
                    return enriched;
                }
                catch (e) {
                    this.logger.warn(`Failed to fetch status for ${name}: ${e.message}`);
                    return { ...inst, tenantId, instanceName: name };
                }
            }));
            return enrichedInstances;
        }
        catch (error) {
            this.logger.error(`Erro ao listar todas as instâncias: ${error.message}`);
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
                token: instanceName,
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
            const payload = {
                url: webhookUrl,
                enabled: true,
                webhook_by_events: false,
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
            const response = await axios_1.default.post(`${baseUrl}/webhook/set/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        }
        catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao configurar webhook no EvolutionAPI: ${JSON.stringify(errorData)}`);
            throw error;
        }
    }
    async setSettings(tenantId, instanceName) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
            const payload = {
                reject_call: false,
                groups_ignore: true,
                always_online: true,
                read_messages: false,
                read_status: false,
                sync_full_history: false
            };
            this.logger.log(`Setting settings for ${instanceName}. Payload: ${JSON.stringify(payload)}`);
            const response = await axios_1.default.post(`${baseUrl}/settings/set/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });
            return response.data;
        }
        catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao configurar settings no EvolutionAPI: ${JSON.stringify(errorData)}`);
            return null;
        }
    }
    async sendText(tenantId, instanceName, number, text) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        const sendRequest = async (targetNumber) => {
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
            const response = await axios_1.default.post(`${baseUrl}/message/sendText/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });
            this.logger.log(`Message sent result: ${JSON.stringify(response.data)}`);
            return response.data;
        };
        try {
            return await sendRequest(number);
        }
        catch (error) {
            const errorData = error.response?.data || error.message;
            const errorString = JSON.stringify(errorData);
            const isExistsError = errorString.includes('"exists":false') || errorString.includes('not found');
            const cleanNum = number.replace(/\D/g, '');
            if (isExistsError && cleanNum.startsWith('55')) {
                let retryNum = '';
                if (cleanNum.length === 13 && cleanNum[4] === '9') {
                    retryNum = cleanNum.slice(0, 4) + cleanNum.slice(5);
                }
                else if (cleanNum.length === 12) {
                    const firstDigitOfNumber = cleanNum[4];
                    if (['6', '7', '8', '9'].includes(firstDigitOfNumber)) {
                        this.logger.debug(`[EvolutionAPI] Number ${cleanNum} looks like a mobile missing the 9. Retrying...`);
                        retryNum = cleanNum.slice(0, 4) + '9' + cleanNum.slice(4);
                    }
                    else {
                        this.logger.warn(`[EvolutionAPI] Number ${cleanNum} failed existence check. It looks like a landline, skipping 9-digit retry.`);
                    }
                }
                if (retryNum) {
                    this.logger.log(`Retrying send with adjusted number: ${retryNum}`);
                    try {
                        return await sendRequest(retryNum);
                    }
                    catch (retryError) {
                        const retryErrorData = retryError.response?.data || retryError.message;
                        this.logger.error(`Retry failed for ${retryNum}: ${JSON.stringify(retryErrorData)}`);
                        if (JSON.stringify(retryErrorData).includes('"exists":false')) {
                            throw new Error(`WhatsApp number does not exist (even after 9-digit fix): ${retryNum}`);
                        }
                    }
                }
                else if (isExistsError) {
                    throw new Error(`WhatsApp number does not exist: ${cleanNum}`);
                }
            }
            this.logger.error(`Erro ao enviar mensagem texto via EvolutionAPI: ${errorString}`);
            throw error;
        }
    }
    async sendMedia(tenantId, instanceName, number, media) {
        const baseUrl = await this.getBaseUrl(tenantId);
        const apiKey = await this.getApiKey(tenantId);
        if (!baseUrl || !apiKey)
            throw new Error('EvolutionAPI não configurada.');
        try {
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
            this.logger.log(`Sending MEDIA to ${finalNumber} via ${instanceName}. Type: ${media.type}`);
            const response = await axios_1.default.post(`${baseUrl}/message/sendMedia/${instanceName}`, payload, {
                headers: { 'apikey': apiKey }
            });
            this.logger.log(`Media sent result: ${JSON.stringify(response.data)}`);
            return response.data;
        }
        catch (error) {
            const errorData = error.response?.data || error.message;
            this.logger.error(`Erro ao enviar MEDIA via EvolutionAPI: ${JSON.stringify(errorData)}`);
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