"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const integrations_module_1 = require("./integrations/integrations.module");
const crm_module_1 = require("./crm/crm.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const support_module_1 = require("./support/support.module");
const debug_module_1 = require("./debug/debug.module");
const ai_module_1 = require("./ai/ai.module");
const usage_module_1 = require("./usage/usage.module");
const audit_module_1 = require("./audit/audit.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            integrations_module_1.IntegrationsModule,
            crm_module_1.CrmModule,
            webhooks_module_1.WebhooksModule,
            dashboard_module_1.DashboardModule,
            campaigns_module_1.CampaignsModule,
            support_module_1.SupportModule,
            debug_module_1.DebugModule,
            ai_module_1.AiModule,
            usage_module_1.UsageModule,
            audit_module_1.AuditModule,
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'redis',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                },
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'postgres',
                port: (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
                username: (process.env.DB_USER || 'zaplandia'),
                password: (process.env.DB_PASS || 'zaplandia_secret'),
                database: (process.env.DB_NAME || 'zaplandia_db'),
                autoLoadEntities: true,
                synchronize: true,
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map