"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const integration_entity_1 = require("./entities/integration.entity");
const api_credential_entity_1 = require("./entities/api-credential.entity");
const integrations_service_1 = require("./integrations.service");
const integrations_controller_1 = require("./integrations.controller");
const user_entity_1 = require("../users/entities/user.entity");
const n8n_service_1 = require("./n8n.service");
const evolution_api_service_1 = require("./evolution-api.service");
const ai_prompt_entity_1 = require("./entities/ai-prompt.entity");
const ai_module_1 = require("../ai/ai.module");
const common_2 = require("@nestjs/common");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                integration_entity_1.Integration,
                api_credential_entity_1.ApiCredential,
                user_entity_1.User,
                ai_prompt_entity_1.AiPrompt
            ]),
            (0, common_2.forwardRef)(() => ai_module_1.AiModule),
        ],
        controllers: [integrations_controller_1.IntegrationsController],
        providers: [integrations_service_1.IntegrationsService, n8n_service_1.N8nService, evolution_api_service_1.EvolutionApiService],
        exports: [integrations_service_1.IntegrationsService, n8n_service_1.N8nService, evolution_api_service_1.EvolutionApiService],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map