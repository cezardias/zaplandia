import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import bcrypt from 'bcryptjs';

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
        const OLD_ID = '3ac9368c-af7c-4183-9816-b90513368f53'; // RESTORED FROM LOGS

        // 1. Ensure a default HQ tenant exists with the ORIGINAL ID
        let hqTenant = await this.tenantsRepository.findOne({ where: { id: OLD_ID } });
        
        // If it doesn't exist by ID, check if it exists by SLUG
        if (!hqTenant) {
            const currentMistake = await this.tenantsRepository.findOne({ where: { slug: 'zaplandia-hq' } });
            
            if (currentMistake) {
                // If it exists by slug but has WRONG ID, we need to migrate it
                if (currentMistake.id !== OLD_ID) {
                    console.log(`[RESTORE] Detected HQ Tenant with WRONG ID (${currentMistake.id}). Migrating to ${OLD_ID}...`);
                    
                    // Rename the old one's slug first to avoid unique constraint conflict
                    try {
                        await this.tenantsRepository.update(currentMistake.id, { slug: `old-hq-${Date.now()}` });
                        
                        // Create the correct one
                        hqTenant = this.tenantsRepository.create({
                            id: OLD_ID,
                            name: 'Zaplandia HQ',
                            slug: 'zaplandia-hq',
                            trialEndsAt: new Date('2099-12-31'),
                        });
                        await this.tenantsRepository.save(hqTenant);

                        // Move all related data
                        await this.usersRepository.query('UPDATE users SET "tenantId" = $1 WHERE "tenantId" = $2', [OLD_ID, currentMistake.id]);
                        await this.usersRepository.query('UPDATE integrations SET "tenantId" = $1 WHERE "tenantId" = $2', [OLD_ID, currentMistake.id]);
                        await this.usersRepository.query('UPDATE api_credentials SET "tenantId" = $1 WHERE "tenantId" = $2', [OLD_ID, currentMistake.id]);
                        
                        // Delete the old one
                        await this.tenantsRepository.delete(currentMistake.id);
                        console.log(`[RESTORE] Successfully migrated data from ${currentMistake.id} to ${OLD_ID}`);
                    } catch (err) {
                        console.error(`[RESTORE] Critical error during HQ migration: ${err.message}`);
                        // If it fails, try to use the mistake one
                        hqTenant = await this.tenantsRepository.findOne({ where: { id: currentMistake.id } });
                    }
                } else {
                    hqTenant = currentMistake;
                }
            } else {
                // Create brand new
                hqTenant = this.tenantsRepository.create({
                    id: OLD_ID,
                    name: 'Zaplandia HQ',
                    slug: 'zaplandia-hq',
                    trialEndsAt: new Date('2099-12-31'),
                });
                await this.tenantsRepository.save(hqTenant);
                console.log(`[RESTORE] Created brand new HQ Tenant with original ID: ${OLD_ID}`);
            }
        }

        const adminExists = await this.usersRepository.findOne({ where: { email: adminEmail } });

        if (!hqTenant) return; // TypeScript guard

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
        } else if (adminExists.tenantId !== hqTenant.id) {
            adminExists.tenantId = hqTenant.id;
            await this.usersRepository.save(adminExists);
            console.log('Existing Super Admin alinhado com HQ Tenant ID original');
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
        // ✅ SECURITY FIX: Never fallback to HQ tenant
        // Each user MUST have their own tenant to prevent data leakage
        if (!userData.tenantId) {
            throw new Error('SECURITY ERROR: tenantId is required for user creation. Each user must have their own isolated tenant.');
        }

        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        const user = this.usersRepository.create(userData as object);
        const savedUser = await this.usersRepository.save(user);

        console.log(`[SECURITY] User created: ${savedUser.email} | TenantId: ${savedUser.tenantId} | Role: ${savedUser.role}`);
        return savedUser;
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
