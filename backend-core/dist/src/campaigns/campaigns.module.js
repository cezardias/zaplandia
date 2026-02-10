"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const campaign_entity_1 = require("./entities/campaign.entity");
const campaign_lead_entity_1 = require("./entities/campaign-lead.entity");
const contact_list_entity_1 = require("./entities/contact-list.entity");
const campaigns_service_1 = require("./campaigns.service");
const campaigns_controller_1 = require("./campaigns.controller");
const crm_module_1 = require("../crm/crm.module");
const bull_1 = require("@nestjs/bull");
const integrations_module_1 = require("../integrations/integrations.module");
const campaign_processor_1 = require("./queues/campaign.processor");
const audit_module_1 = require("../audit/audit.module");
const usage_module_1 = require("../usage/usage.module");
let CampaignsModule = class CampaignsModule {
};
exports.CampaignsModule = CampaignsModule;
exports.CampaignsModule = CampaignsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([campaign_entity_1.Campaign, campaign_lead_entity_1.CampaignLead, contact_list_entity_1.ContactList]),
            crm_module_1.CrmModule,
            bull_1.BullModule.registerQueue({
                name: 'campaign-queue',
            }),
            integrations_module_1.IntegrationsModule,
            audit_module_1.AuditModule,
            usage_module_1.UsageModule
        ],
        providers: [campaigns_service_1.CampaignsService, campaign_processor_1.CampaignProcessor],
        controllers: [campaigns_controller_1.CampaignsController],
        exports: [campaigns_service_1.CampaignsService],
    })
], CampaignsModule);
//# sourceMappingURL=campaigns.module.js.map