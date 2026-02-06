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
var UsageService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const daily_usage_entity_1 = require("./entities/daily-usage.entity");
let UsageService = UsageService_1 = class UsageService {
    usageRepository;
    logger = new common_1.Logger(UsageService_1.name);
    LIMITS = {
        'whatsapp_messages': 40
    };
    constructor(usageRepository) {
        this.usageRepository = usageRepository;
    }
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }
    async checkAndReserve(tenantId, instanceName, feature, amount) {
        const today = this.getTodayString();
        const limit = this.LIMITS[feature] || 999999;
        let usage = await this.usageRepository.findOne({
            where: { tenantId, instanceName, day: today, feature }
        });
        if (!usage) {
            usage = this.usageRepository.create({
                tenantId,
                instanceName,
                day: today,
                feature,
                count: 0
            });
        }
        const newTotal = usage.count + amount;
        if (newTotal > limit) {
            this.logger.warn(`[LIMIT_REACHED] Instance ${instanceName} usage: ${usage.count}/${limit}. Attempted: ${amount}`);
            const remaining = Math.max(0, limit - usage.count);
            throw new common_1.BadRequestException(`Limite diário da instância atingido! Esta instância já enviou ${usage.count} mensagens hoje. ` +
                `Seu limite restante é de ${remaining} envios, mas você tentou enviar ${amount}. ` +
                `Tente dividir a campanha ou aguarde até amanhã.`);
        }
        usage.count += amount;
        await this.usageRepository.save(usage);
        this.logger.log(`[USAGE] Instance ${instanceName} reserved ${amount} ${feature}. New total: ${usage.count}/${limit}`);
    }
    async getRemainingQuota(tenantId, instanceName, feature) {
        const today = this.getTodayString();
        const limit = this.LIMITS[feature] || 999999;
        const usage = await this.usageRepository.findOne({
            where: { tenantId, instanceName, day: today, feature }
        });
        const current = usage ? usage.count : 0;
        return Math.max(0, limit - current);
    }
    async parseUsage(tenantId, feature) {
        const today = this.getTodayString();
        const usage = await this.usageRepository.findOne({
            where: { tenantId, day: today, feature }
        });
        return usage ? usage.count : 0;
    }
};
exports.UsageService = UsageService;
exports.UsageService = UsageService = UsageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(daily_usage_entity_1.DailyUsage)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], UsageService);
//# sourceMappingURL=usage.service.js.map