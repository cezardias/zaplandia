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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const integrations_service_1 = require("./integrations.service");
let AiService = AiService_1 = class AiService {
    integrationsService;
    logger = new common_1.Logger(AiService_1.name);
    aiUrl = process.env.AI_SERVICE_URL || 'http://backend-ai:8000';
    constructor(integrationsService) {
        this.integrationsService = integrationsService;
    }
    async getAiResponse(tenantId, prompt, provider, context) {
        try {
            const apiKey = await this.integrationsService.getCredential(tenantId, 'GEMINI_API_KEY');
            const integrations = await this.integrationsService.findAllByTenant(tenantId, 'admin');
            const integration = integrations.find(i => i.provider === provider);
            let systemInstruction = context || "Você é o assistente da Zaplandia.";
            if (integration?.settings?.aiEnabled && integration?.settings?.aiPrompt) {
                systemInstruction = integration.settings.aiPrompt;
            }
            const response = await axios_1.default.post(`${this.aiUrl}/v1/chat`, {
                prompt,
                system_instruction: systemInstruction,
                api_key: apiKey
            });
            return response.data.response;
        }
        catch (error) {
            this.logger.error('Failed to get AI response', error.message);
            return "Desculpe, meu cérebro de silício está processando algo. Tente novamente em um minuto! 🤖";
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => integrations_service_1.IntegrationsService))),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], AiService);
//# sourceMappingURL=ai.service.js.map