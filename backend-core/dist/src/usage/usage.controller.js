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
var UsageController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageController = void 0;
const common_1 = require("@nestjs/common");
const usage_service_1 = require("./usage.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UsageController = UsageController_1 = class UsageController {
    usageService;
    logger = new common_1.Logger(UsageController_1.name);
    constructor(usageService) {
        this.usageService = usageService;
    }
    async resetInstanceUsage(req, instanceName) {
        this.logger.log(`[RESET_USAGE] Request to reset usage for instance ${instanceName} by user ${req.user.email}`);
        await this.usageService.resetUsage(req.user.tenantId, instanceName, 'whatsapp_messages');
        return { message: `Quota reset for instance ${instanceName}` };
    }
};
exports.UsageController = UsageController;
__decorate([
    (0, common_1.Delete)(':instanceName'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsageController.prototype, "resetInstanceUsage", null);
exports.UsageController = UsageController = UsageController_1 = __decorate([
    (0, common_1.Controller)('api/usage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [usage_service_1.UsageService])
], UsageController);
//# sourceMappingURL=usage.controller.js.map