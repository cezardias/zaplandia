import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../users/entities/tenant.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { Repository } from 'typeorm';

/**
 * Script to restore the original tenant ID from historical EvolutionAPI instances.
 * 1. Find the current SuperAdmin and HQ Tenant.
 * 2. Migrate them to the original UUID: 3ac9368c-af7c-4183-9816-b90513368f53
 */
async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const tenantRepo = app.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    const integrationRepo = app.get<Repository<Integration>>(getRepositoryToken(Integration));

    const OLD_ID = '3ac9368c-af7c-4183-9816-b90513368f53';
    const NEW_ADMIN_EMAIL = 'cezar.dias@gmail.com';

    console.log(`🔧 Inciando restauração do Tenant ID para: ${OLD_ID}`);

    const admin = await userRepo.findOne({ where: { email: NEW_ADMIN_EMAIL } });
    if (!admin) {
        console.error('❌ SuperAdmin não encontrado!');
        await app.close();
        return;
    }

    const currentTenantId = admin.tenantId;
    console.log(`   Admin atual: ${admin.email} | Tenant Atual: ${currentTenantId}`);

    if (currentTenantId === OLD_ID) {
        console.log('✅ IDs já estão alinhados!');
        await app.close();
        return;
    }

    // PASSO 1: Criar novo tenant com ID Antigo (ou atualizar se possível)
    console.log('📝 PASSO 1: Criando/Restaurando Tenant com ID original...');
    
    // Deletamos se houver algum lixo com esse ID (improvável se as integracoes deram 0)
    await tenantRepo.query(`DELETE FROM tenants WHERE id = $1`, [OLD_ID]);
    
    await tenantRepo.query(`
        INSERT INTO tenants (id, name, slug, "trialEndsAt", "createdAt", "updatedAt")
        SELECT $1, name, slug, "trialEndsAt", "createdAt", "updatedAt"
        FROM tenants WHERE id = $2
    `, [OLD_ID, currentTenantId]);

    // PASSO 2: Migrar Usuário
    console.log('📝 PASSO 2: Migrando SuperAdmin para o Tenant ID original...');
    await userRepo.query(`UPDATE users SET "tenantId" = $1 WHERE "tenantId" = $2`, [OLD_ID, currentTenantId]);

    // PASSO 3: Migrar qualquer Integração órfã (se houver)
    console.log('📝 PASSO 3: Migrando Integrações e Credenciais...');
    await integrationRepo.query(`UPDATE integrations SET "tenantId" = $1 WHERE "tenantId" = $2`, [OLD_ID, currentTenantId]);
    await integrationRepo.query(`UPDATE api_credentials SET "tenantId" = $1 WHERE "tenantId" = $2`, [OLD_ID, currentTenantId]);

    // PASSO 4: Restaurar URL do n8n (caso esteja nula como observado no debug)
    const n8nUrl = 'https://auto.zaplandia.com.br/webhook/a5e8286b-73a4-498c-8433-7d995aa28373';
    console.log(`📝 PASSO 4: Garantindo URL do n8n: ${n8nUrl}`);
    
    // Deletar duplicatas globais/de outros tenants para essa chave para evitar conflito
    await integrationRepo.query(`DELETE FROM api_credentials WHERE key_name = 'N8N_WEBHOOK_URL' AND "tenantId" = $1`, [OLD_ID]);
    
    await integrationRepo.query(`
        INSERT INTO api_credentials (id, key_name, key_value, "tenantId", "createdAt")
        VALUES (gen_random_uuid(), 'N8N_WEBHOOK_URL', $1, $2, NOW())
    `, [n8nUrl, OLD_ID]);

    // PASSO 5: Limpeza
    console.log('📝 PASSO 5: Removendo Tenant temporário...');
    await tenantRepo.query(`DELETE FROM tenants WHERE id = $1`, [currentTenantId]);

    console.log('\n✅ RESTAURAÇÃO CONCLUÍDA!');
    console.log('O sistema agora está alinhado com a Evolution API e o n8n.');

    await app.close();
}

bootstrap().catch(err => {
    console.error('❌ Erro fatale no script:', err);
    process.exit(1);
});
