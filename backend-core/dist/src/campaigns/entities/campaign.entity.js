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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Campaign = exports.CampaignStatus = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../../users/entities/tenant.entity");
const campaign_lead_entity_1 = require("./campaign-lead.entity");
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["PENDING"] = "pending";
    CampaignStatus["RUNNING"] = "running";
    CampaignStatus["PAUSED"] = "paused";
    CampaignStatus["COMPLETED"] = "completed";
    CampaignStatus["FAILED"] = "failed";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
let Campaign = class Campaign {
    id;
    name;
    status;
    channels;
    messageTemplate;
    integrationId;
    variations;
    tenant;
    tenantId;
    leads;
    createdAt;
    updatedAt;
};
exports.Campaign = Campaign;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Campaign.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Campaign.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CampaignStatus,
        default: CampaignStatus.PENDING,
    }),
    __metadata("design:type", String)
], Campaign.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Campaign.prototype, "channels", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "messageTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Campaign.prototype, "integrationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Campaign.prototype, "variations", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    __metadata("design:type", tenant_entity_1.Tenant)
], Campaign.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Campaign.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => campaign_lead_entity_1.CampaignLead, (lead) => lead.campaign, { onDelete: 'CASCADE' }),
    __metadata("design:type", Array)
], Campaign.prototype, "leads", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Campaign.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Campaign.prototype, "updatedAt", void 0);
exports.Campaign = Campaign = __decorate([
    (0, typeorm_1.Entity)('campaigns')
], Campaign);
//# sourceMappingURL=campaign.entity.js.map