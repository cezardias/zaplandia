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
            // ✅ Roles
            try {
                await this.usersRepository.query(`ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'agent'`);
            } catch (e) { /* ignore if already exists */ }
            
            try {
                await this.usersRepository.query(`ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'superadmin'`);
            } catch (e) { /* ignore */ }

            // ✅ ENSURE TABLES EXIST (since synchronize: false)
            console.log('[SCHEMA] Ensuring billing tables exist...');
            
            // 1. Create billing_configs table
            await this.usersRepository.query(`
                CREATE TABLE IF NOT EXISTS "billing_configs" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "btgClientId" character varying,
                    "btgClientSecret" character varying,
                    "smtpHost" character varying DEFAULT 'cal.zaplandia.com.br',
                    "smtpPort" integer DEFAULT 587,
                    "smtpUser" character varying DEFAULT 'financeiro@zaplandia.com.br',
                    "smtpPass" character varying,
                    "btgPixKey" character varying,
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_billing_configs" PRIMARY KEY ("id")
                )
            `);

            // 2. Create migrations for types if they don't exist
            try {
                await this.usersRepository.query(`ALTER TYPE transactions_method_enum ADD VALUE IF NOT EXISTS 'debit_card'`);
            } catch (e) { 
                try {
                    await this.usersRepository.query(`CREATE TYPE "transactions_method_enum" AS ENUM('pix', 'boleto', 'credit_card', 'debit_card')`);
                } catch (err) { /* ignore */ }
            }

            try {
                await this.usersRepository.query(`ALTER TYPE transactions_method_enum ADD VALUE IF NOT EXISTS 'boleto'`);
            } catch (e) { /* ignore */ }

            // 3. Create transactions table
            try {
                await this.usersRepository.query(`
                    CREATE TABLE IF NOT EXISTS "transactions" (
                        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                        "tenantId" uuid NOT NULL,
                        "amount" decimal(10,2) NOT NULL,
                        "method" character varying NOT NULL,
                        "status" character varying NOT NULL DEFAULT 'pending',
                        "installments" integer,
                        "btgPaymentId" character varying,
                        "checkoutUrl" character varying,
                        "pixQrCode" text,
                        "pixCopyPaste" text,
                        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                        CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
                    )
                `);
            } catch (e) { /* ignore */ }

            // ✅ Tenants Schema Upgrade (Trial/Plans/Billing Info)
            console.log('[SCHEMA] Checking for missing columns in tenants table...');
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "planType" VARCHAR DEFAULT 'trial'`);
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "subscriptionStatus" VARCHAR DEFAULT 'trial'`);
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "paidUntil" TIMESTAMP`);
            
            // New Billing Fields
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "responsibleName" VARCHAR`);
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "responsibleCpf" VARCHAR`);
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "cnpj" VARCHAR`);
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "razaoSocial" VARCHAR`);
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "responsiblePhone" VARCHAR`);
            await this.tenantsRepository.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "responsibleEmail" VARCHAR`);
            
            await this.seedSuperAdmin();
        } catch (e) {
            console.error('Erro ao inicializar banco de dados ou migrar esquema:', e);
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
                        const tables = [
                            'users', 
                            'integrations', 
                            'api_credentials', 
                            'ai_prompts', 
                            'contacts', 
                            'messages', 
                            'campaigns', 
                            'contact_lists', 
                            'daily_usage', 
                            'audit_logs', 
                            'pipeline_stages'
                        ];

                        for (const table of tables) {
                            try {
                                await this.usersRepository.query(`UPDATE ${table} SET "tenantId" = $1 WHERE "tenantId" = $2`, [OLD_ID, currentMistake.id]);
                            } catch (e) {
                                // Silent skip if table doesn't exist or doesn't have tenantId (though we checked)
                                console.warn(`[RESTORE] Could not migrate table ${table}: ${e.message}`);
                            }
                        }
                        
                        // Delete the old one
                        await this.tenantsRepository.delete(currentMistake.id);
                        console.log(`[RESTORE] Successfully migrated ALL data from ${currentMistake.id} to ${OLD_ID}`);
                    } catch (err) {
                        console.error(`[RESTORE] Critical error during HQ migration: ${err.message}`);
                        // Fallback: reload the old one to avoid leaving hqTenant null
                        hqTenant = await this.tenantsRepository.findOne({ where: { slug: 'zaplandia-hq' } }) || 
                                   await this.tenantsRepository.findOne({ where: { id: currentMistake.id } });
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

    async findAllByTenant(tenantId: string): Promise<User[]> {
        return this.usersRepository.find({
            where: { tenantId },
            order: { name: 'ASC' }
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
