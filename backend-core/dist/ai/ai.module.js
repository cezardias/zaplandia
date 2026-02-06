"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ai_service_1 = require("./ai.service");
const ai_controller_1 = require("./ai.controller");
const crm_entity_1 = require("../crm/entities/crm.entity");
const integration_entity_1 = require("../integrations/entities/integration.entity");
const integrations_module_1 = require("../integrations/integrations.module");
const ai_prompt_entity_1 = require("../integrations/entities/ai-prompt.entity");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([crm_entity_1.Contact, crm_entity_1.Message, integration_entity_1.Integration, ai_prompt_entity_1.AiPrompt]),
            (0, common_1.forwardRef)(() => integrations_module_1.IntegrationsModule),
        ],
        controllers: [ai_controller_1.AiController],
        providers: [ai_service_1.AiService],
        exports: [ai_service_1.AiService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map