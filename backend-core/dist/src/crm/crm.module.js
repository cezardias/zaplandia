"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crm_entity_1 = require("./entities/crm.entity");
const campaign_lead_entity_1 = require("../campaigns/entities/campaign-lead.entity");
const crm_service_1 = require("./crm.service");
const crm_controller_1 = require("./crm.controller");
const upload_controller_1 = require("./upload.controller");
const integrations_module_1 = require("../integrations/integrations.module");
const campaign_entity_1 = require("../campaigns/entities/campaign.entity");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([crm_entity_1.Contact, crm_entity_1.Message, campaign_lead_entity_1.CampaignLead, campaign_entity_1.Campaign]),
            integrations_module_1.IntegrationsModule
        ],
        controllers: [crm_controller_1.CrmController, upload_controller_1.UploadController],
        providers: [crm_service_1.CrmService],
        exports: [crm_service_1.CrmService],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map