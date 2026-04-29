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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
let AuthService = class AuthService {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findOneByEmail(email);
        if (user && await bcryptjs_1.default.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            teamId: user.teamId
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                teamId: user.teamId,
            }
        };
    }
    async register(data) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 15);
        const companyName = data.companyName || `${data.name}'s Business`;
        const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const uniqueSlug = `${baseSlug}-${Date.now()}`;
        const tenant = await this.usersService.createTenant({
            name: companyName,
            slug: uniqueSlug,
            trialEndsAt: trialEndDate,
        });
        console.log(`[SECURITY] New tenant created: ${tenant.name} | ID: ${tenant.id} | Slug: ${tenant.slug}`);
        const user = await this.usersService.create({
            ...data,
            tenantId: tenant.id,
        });
        console.log(`[SECURITY] New user registered: ${user.email} | TenantId: ${user.tenantId}`);
        return user;
    }
    async googleLogin(profile) {
        if (!profile) {
            throw new common_1.UnauthorizedException('Perfil do Google não fornecido.');
        }
        let user = await this.usersService.findOneByEmail(profile.email);
        if (!user) {
            const rawFirstName = String(profile.firstName || '');
            const rawLastName = String(profile.lastName || '');
            const firstName = (rawFirstName && rawFirstName !== 'undefined' && rawFirstName !== 'null') ? rawFirstName : '';
            const lastName = (rawLastName && rawLastName !== 'undefined' && rawLastName !== 'null') ? rawLastName : '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Usuário Zaplândia';
            user = await this.register({
                email: profile.email,
                name: fullName.trim(),
                password: Math.random().toString(36).slice(-12),
                companyName: `Negócio de ${firstName || 'Zaplândia'}`,
            });
            console.log(`[GOOGLE] Novo cadastro automático via Google: ${user.email}`);
        }
        else {
            console.log(`[GOOGLE] Login realizado com sucesso: ${user.email}`);
        }
        return this.login(user);
    }
    async facebookLogin(profile) {
        if (!profile) {
            throw new common_1.UnauthorizedException('Perfil do Facebook não fornecido.');
        }
        let user = await this.usersService.findOneByEmail(profile.email);
        if (!user) {
            const rawFirstName = String(profile.firstName || '');
            const rawLastName = String(profile.lastName || '');
            const firstName = (rawFirstName && rawFirstName !== 'undefined' && rawFirstName !== 'null') ? rawFirstName : '';
            const lastName = (rawLastName && rawLastName !== 'undefined' && rawLastName !== 'null') ? rawLastName : '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Usuário Zaplândia';
            user = await this.register({
                email: profile.email,
                name: fullName.trim(),
                password: Math.random().toString(36).slice(-12),
                companyName: `Negócio de ${firstName || 'Zaplândia'}`,
            });
            console.log(`[META] Novo cadastro automático via Facebook: ${user.email}`);
        }
        else {
            console.log(`[META] Login realizado com sucesso: ${user.email}`);
        }
        return this.login(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map