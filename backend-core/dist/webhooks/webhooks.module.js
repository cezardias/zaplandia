"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const webhooks_controller_1 = require("./webhooks.controller");
const crm_module_1 = require("../crm/crm.module");
const integrations_module_1 = require("../integrations/integrations.module");
const ai_module_1 = require("../ai/ai.module");
const typeorm_1 = require("@nestjs/typeorm");
const crm_entity_1 = require("../crm/entities/crm.entity");
const campaign_lead_entity_1 = require("../campaigns/entities/campaign-lead.entity");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            crm_module_1.CrmModule,
            integrations_module_1.IntegrationsModule,
            ai_module_1.AiModule,
            typeorm_1.TypeOrmModule.forFeature([crm_entity_1.Contact, crm_entity_1.Message, campaign_lead_entity_1.CampaignLead])
        ],
        controllers: [webhooks_controller_1.WebhooksController],
        providers: [],
    })
], WebhooksModule);
//# sourceMappingURL=webhooks.module.js.map