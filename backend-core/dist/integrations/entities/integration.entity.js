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
exports.Integration = exports.IntegrationStatus = exports.IntegrationProvider = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../../users/entities/tenant.entity");
var IntegrationProvider;
(function (IntegrationProvider) {
    IntegrationProvider["FACEBOOK"] = "facebook";
    IntegrationProvider["INSTAGRAM"] = "instagram";
    IntegrationProvider["WHATSAPP"] = "whatsapp";
    IntegrationProvider["TELEGRAM"] = "telegram";
    IntegrationProvider["YOUTUBE"] = "youtube";
    IntegrationProvider["TIKTOK"] = "tiktok";
    IntegrationProvider["LINKEDIN"] = "linkedin";
    IntegrationProvider["GOOGLE_DRIVE"] = "google_drive";
    IntegrationProvider["GOOGLE_SHEETS"] = "google_sheets";
    IntegrationProvider["MERCADO_LIVRE"] = "mercadolivre";
    IntegrationProvider["OLX"] = "olx";
    IntegrationProvider["N8N"] = "n8n";
    IntegrationProvider["EVOLUTION"] = "evolution";
})(IntegrationProvider || (exports.IntegrationProvider = IntegrationProvider = {}));
var IntegrationStatus;
(function (IntegrationStatus) {
    IntegrationStatus["CONNECTED"] = "connected";
    IntegrationStatus["DISCONNECTED"] = "disconnected";
    IntegrationStatus["EXPIRED"] = "expired";
    IntegrationStatus["ERROR"] = "error";
})(IntegrationStatus || (exports.IntegrationStatus = IntegrationStatus = {}));
let Integration = class Integration {
    id;
    provider;
    status;
    credentials;
    settings;
    tenant;
    tenantId;
    createdAt;
    updatedAt;
};
exports.Integration = Integration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Integration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IntegrationProvider,
    }),
    __metadata("design:type", String)
], Integration.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IntegrationStatus,
        default: IntegrationStatus.DISCONNECTED,
    }),
    __metadata("design:type", String)
], Integration.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Integration.prototype, "credentials", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Integration.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    __metadata("design:type", tenant_entity_1.Tenant)
], Integration.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Integration.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Integration.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Integration.prototype, "updatedAt", void 0);
exports.Integration = Integration = __decorate([
    (0, typeorm_1.Entity)('integrations')
], Integration);
//# sourceMappingURL=integration.entity.js.map