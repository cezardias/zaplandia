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
exports.CampaignLead = exports.LeadStatus = void 0;
const typeorm_1 = require("typeorm");
const campaign_entity_1 = require("./campaign.entity");
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["PENDING"] = "pending";
    LeadStatus["SENT"] = "sent";
    LeadStatus["FAILED"] = "failed";
    LeadStatus["INVALID"] = "invalid";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
let CampaignLead = class CampaignLead {
    id;
    name;
    externalId;
    status;
    errorReason;
    campaign;
    campaignId;
    sentAt;
    createdAt;
};
exports.CampaignLead = CampaignLead;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampaignLead.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CampaignLead.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CampaignLead.prototype, "externalId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LeadStatus,
        default: LeadStatus.PENDING,
    }),
    __metadata("design:type", String)
], CampaignLead.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CampaignLead.prototype, "errorReason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => campaign_entity_1.Campaign, (campaign) => campaign.leads),
    __metadata("design:type", campaign_entity_1.Campaign)
], CampaignLead.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CampaignLead.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CampaignLead.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CampaignLead.prototype, "createdAt", void 0);
exports.CampaignLead = CampaignLead = __decorate([
    (0, typeorm_1.Entity)('campaign_leads')
], CampaignLead);
//# sourceMappingURL=campaign-lead.entity.js.map