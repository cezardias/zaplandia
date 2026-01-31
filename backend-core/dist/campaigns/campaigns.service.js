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
var CampaignsService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campaign_entity_1 = require("./entities/campaign.entity");
const campaign_lead_entity_1 = require("./entities/campaign-lead.entity");
const crm_service_1 = require("../crm/crm.service");
let CampaignsService = CampaignsService_1 = class CampaignsService {
    campaignRepository;
    leadRepository;
    crmService;
    logger = new common_1.Logger(CampaignsService_1.name);
    constructor(campaignRepository, leadRepository, crmService) {
        this.campaignRepository = campaignRepository;
        this.leadRepository = leadRepository;
        this.crmService = crmService;
    }
    async findAllByTenant(tenantId) {
        return this.campaignRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }
    async create(tenantId, data) {
        try {
            const campaignData = {
                name: data.name,
                channels: data.channels,
                messageTemplate: data.messageTemplate,
                integrationId: data.integrationId,
                status: campaign_entity_1.CampaignStatus.PENDING,
                tenantId,
            };
            const campaign = this.campaignRepository.create(campaignData);
            const saved = await this.campaignRepository.save(campaign);
            const campaignId = saved.id;
            if (data.leads && Array.isArray(data.leads)) {
                const leads = data.leads.map(l => this.leadRepository.create({
                    name: l.name || 'Contato',
                    externalId: String(l.externalId || l.phoneNumber || ''),
                    campaignId: campaignId,
                    status: campaign_lead_entity_1.LeadStatus.PENDING
                }));
                const chunkSize = 500;
                for (let i = 0; i < leads.length; i += chunkSize) {
                    await this.leadRepository.save(leads.slice(i, i + chunkSize));
                }
                this.logger.log(`Created ${leads.length} leads for campaign ${campaignId}`);
            }
            else if (data.useExistingContacts) {
                const contacts = await this.crmService.findAllByTenant(tenantId);
                if (contacts.length > 0) {
                    const leads = contacts.map(c => this.leadRepository.create({
                        name: c.name || 'Contato',
                        externalId: c.externalId || c.phoneNumber || '',
                        campaignId: campaignId,
                        status: campaign_lead_entity_1.LeadStatus.PENDING
                    }));
                    const chunkSize = 500;
                    for (let i = 0; i < leads.length; i += chunkSize) {
                        await this.leadRepository.save(leads.slice(i, i + chunkSize));
                    }
                    this.logger.log(`Created ${leads.length} leads from contacts for campaign ${campaignId}`);
                }
            }
            return {
                id: saved.id,
                name: saved.name,
                status: saved.status,
                channels: saved.channels,
                messageTemplate: saved.messageTemplate,
                createdAt: saved.createdAt
            };
        }
        catch (error) {
            this.logger.error(`Error creating campaign: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id, tenantId) {
        return this.campaignRepository.findOne({
            where: { id, tenantId },
            relations: ['leads'],
        });
    }
    async updateStatus(id, tenantId, status) {
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            campaign.status = status;
            return this.campaignRepository.save(campaign);
        }
        return null;
    }
    async remove(id, tenantId) {
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            return this.campaignRepository.remove(campaign);
        }
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = CampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(campaign_lead_entity_1.CampaignLead)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, crm_service_1.CrmService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map