import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from '../users/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const tenantRepo = app.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

    console.log('🚀 Iniciando atualização de esquema do banco de dados...');

    try {
        // 1. Atualizar Tabela Tenants
        console.log('📝 Adicionando colunas de Planos na tabela tenants...');
        await tenantRepo.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "planType" VARCHAR DEFAULT 'trial'`);
        await tenantRepo.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "subscriptionStatus" VARCHAR DEFAULT 'trial'`);
        await tenantRepo.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "paidUntil" TIMESTAMP`);
        await tenantRepo.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()`);

        // 2. Atualizar Enum de Roles
        console.log('📝 Garantindo que as Roles SuperAdmin e Agent existam...');
        try {
            await userRepo.query(`ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'superadmin'`);
        } catch (e) {
            console.log('   (Role superadmin provavelmente já existe)');
        }
        try {
            await userRepo.query(`ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'agent'`);
        } catch (e) {
            console.log('   (Role agent provavelmente já existe)');
        }

        console.log('\n✅ ESQUEMA ATUALIZADO COM SUCESSO!');
    } catch (err) {
        console.error('❌ Erro durante a atualização:', err);
    } finally {
        await app.close();
    }
}

bootstrap().catch(err => {
    console.error('❌ Erro fatal no script:', err);
    process.exit(1);
});
