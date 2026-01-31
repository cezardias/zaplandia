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
var N8nService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nService = void 0;
const common_1 = require("@nestjs/common");
const integrations_service_1 = require("./integrations.service");
const axios_1 = __importDefault(require("axios"));
let N8nService = N8nService_1 = class N8nService {
    integrationsService;
    logger = new common_1.Logger(N8nService_1.name);
    constructor(integrationsService) {
        this.integrationsService = integrationsService;
    }
    async triggerWebhook(tenantId, payload) {
        try {
            const webhookUrl = await this.integrationsService.getCredential(tenantId, 'N8N_WEBHOOK_URL');
            if (!webhookUrl) {
                this.logger.debug(`n8n Webhook não configurado para o tenant ${tenantId}. Pulando.`);
                return;
            }
            this.logger.log(`Enviando evento para n8n: ${webhookUrl}`);
            axios_1.default.post(webhookUrl, {
                ...payload,
                timestamp: new Date().toISOString(),
                platform: 'zaplandia'
            }).catch(err => {
                this.logger.error(`Erro ao enviar para n8n: ${err.message}`);
            });
        }
        catch (error) {
            this.logger.error(`Erro inesperado no trigger n8n: ${error.message}`);
        }
    }
};
exports.N8nService = N8nService;
exports.N8nService = N8nService = N8nService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], N8nService);
//# sourceMappingURL=n8n.service.js.map