import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
    ) { }

    async onModuleInit() {
        try {
            await this.seedSuperAdmin();
        } catch (e) {
            console.error('Erro ao inicializar banco de dados/seed:', e);
        }
    }

    async seedSuperAdmin() {
        const adminEmail = 'cezar.dias@gmail.com';

        // 1. Ensure a default HQ tenant exists
        let hqTenant = await this.tenantsRepository.findOne({ where: { slug: 'zaplandia-hq' } });
        if (!hqTenant) {
            hqTenant = this.tenantsRepository.create({
                name: 'Zaplandia HQ',
                slug: 'zaplandia-hq',
                trialEndsAt: new Date('2099-12-31'), // Forever for HQ
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
                role: UserRole.SUPERADMIN,
                tenantId: hqTenant.id,
            });
            await this.usersRepository.save(superAdmin);
            console.log('Super Admin cezar.dias@gmail.com criado com sucesso!');
        } else if (!adminExists.tenantId) {
            // Fix existing admin missing tenantId
            adminExists.tenantId = hqTenant.id;
            await this.usersRepository.save(adminExists);
            console.log('Existing Super Admin updated with HQ TenantId');
        }
    }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'name', 'role', 'tenantId'] as any
        });
    }

    async findAllTenants(): Promise<Tenant[]> {
        return this.tenantsRepository.find({ order: { name: 'ASC' } });
    }

    async create(userData: any): Promise<User> {
        // Ensure every user has a tenant. If none provided, try to find HQ or first available.
        if (!userData.tenantId) {
            const hq = await this.tenantsRepository.findOne({ where: { name: 'Zaplandia HQ' } })
                || await this.tenantsRepository.findOne({ where: {} });
            if (hq) {
                userData.tenantId = hq.id;
            }
        }

        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        const user = this.usersRepository.create(userData as object);
        return this.usersRepository.save(user);
    }

    async createTenant(tenantData: any): Promise<Tenant> {
        const tenant = this.tenantsRepository.create(tenantData as object);
        return this.tenantsRepository.save(tenant);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({
            relations: ['tenant'],
            order: { createdAt: 'DESC' }
        });
    }

    async update(id: string, updateData: any): Promise<User | null> {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        await this.usersRepository.update(id, updateData);
        return this.usersRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
