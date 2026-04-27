import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IntegrationsService } from '../integrations/integrations.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('FixMetaScript');
    logger.log('Starting Meta Integration Sync script...');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const integrationsService = app.get(IntegrationsService);
    
    // We need to find all tenants that have Meta credentials
    // For simplicity, we can just fetch all integrations and sync those that are 'whatsapp'
    const integrations = await (integrationsService as any).integrationRepository.find({
        where: { provider: 'whatsapp' }
    });
    
    logger.log(`Found ${integrations.length} WhatsApp (Meta) integrations to sync.`);
    
    for (const integration of integrations) {
        logger.log(`Syncing Meta for tenant: ${integration.tenantId}`);
        await integrationsService.syncMetaIntegration(integration.tenantId);
    }
    
    logger.log('Sync complete!');
    await app.close();
}

bootstrap().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
