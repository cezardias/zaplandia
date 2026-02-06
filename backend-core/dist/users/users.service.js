"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const tenant_entity_1 = require("./entities/tenant.entity");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    usersRepository;
    tenantsRepository;
    constructor(usersRepository, tenantsRepository) {
        this.usersRepository = usersRepository;
        this.tenantsRepository = tenantsRepository;
    }
    async onModuleInit() {
        try {
            await this.seedSuperAdmin();
        }
        catch (e) {
            console.error('Erro ao inicializar banco de dados/seed:', e);
        }
    }
    async seedSuperAdmin() {
        const adminEmail = 'cezar.dias@gmail.com';
        let hqTenant = await this.tenantsRepository.findOne({ where: { slug: 'zaplandia-hq' } });
        if (!hqTenant) {
            hqTenant = this.tenantsRepository.create({
                name: 'Zaplandia HQ',
                slug: 'zaplandia-hq',
                trialEndsAt: new Date('2099-12-31'),
            });
            await this.tenantsRepository.save(hqTenant);
            console.log('HQ Tenant created');
        }
        const adminExists = await this.usersRepository.findOne({ where: { email: adminEmail } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('zap@2026', 10);
            const superAdmin = this.usersRepository.create({
                email: adminEmail,
                password: hashedPassword,
                name: 'Cezar Dias',
                role: user_entity_1.UserRole.SUPERADMIN,
                tenantId: hqTenant.id,
            });
            await this.usersRepository.save(superAdmin);
            console.log('Super Admin cezar.dias@gmail.com criado com sucesso!');
        }
        else if (!adminExists.tenantId) {
            adminExists.tenantId = hqTenant.id;
            await this.usersRepository.save(adminExists);
            console.log('Existing Super Admin updated with HQ TenantId');
        }
    }
    async findOneByEmail(email) {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'name', 'role', 'tenantId']
        });
    }
    async findAllTenants() {
        return this.tenantsRepository.find({ order: { name: 'ASC' } });
    }
    async create(userData) {
        if (!userData.tenantId) {
            throw new Error('SECURITY ERROR: tenantId is required for user creation. Each user must have their own isolated tenant.');
        }
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }
        const user = this.usersRepository.create(userData);
        const savedUser = await this.usersRepository.save(user);
        console.log(`[SECURITY] User created: ${savedUser.email} | TenantId: ${savedUser.tenantId} | Role: ${savedUser.role}`);
        return savedUser;
    }
    async createTenant(tenantData) {
        const tenant = this.tenantsRepository.create(tenantData);
        return this.tenantsRepository.save(tenant);
    }
    async findAll() {
        return this.usersRepository.find({
            relations: ['tenant'],
            order: { createdAt: 'DESC' }
        });
    }
    async update(id, updateData) {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        await this.usersRepository.update(id, updateData);
        return this.usersRepository.findOneBy({ id });
    }
    async remove(id) {
        await this.usersRepository.delete(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], UsersService);
//# sourceMappingURL=users.service.js.map