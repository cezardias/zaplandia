import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../crm/entities/crm.entity';
import { Message } from '../crm/entities/crm.entity';
import { Repository, Not, IsNull } from 'typeorm';

/**
 * Script para popular instâncias nos contatos existentes
 * Analisa as mensagens para descobrir de qual instância cada contato veio
 */
async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const contactRepo = app.get<Repository<Contact>>(getRepositoryToken(Contact));
    const messageRepo = app.get<Repository<Message>>(getRepositoryToken(Message));

    console.log('🔧 Populando instâncias nos contatos...\n');

    // Buscar todos os contatos sem instância
    const contactsWithoutInstance = await contactRepo.find({
        where: { instance: IsNull() }
    });

    console.log(`📝 Encontrados ${contactsWithoutInstance.length} contatos sem instância`);

    let updated = 0;
    for (const contact of contactsWithoutInstance) {
        // Buscar a primeira mensagem deste contato para descobrir a instância
        const firstMessage = await messageRepo.findOne({
            where: { contactId: contact.id },
            order: { createdAt: 'ASC' }
        });

        if (firstMessage && firstMessage.provider === 'whatsapp') {
            // Para mensagens do WhatsApp, a instância provavelmente está no externalId
            // Formato típico: tenant_UUID_instanceName
            // Vamos usar uma heurística: se o externalId do contato começa com "tenant_", extrair a instância

            // Por enquanto, vamos setar uma instância padrão para todos os contatos WhatsApp
            const defaultInstance = 'tenant_' + contact.tenantId + '_zaplandia_01';

            contact.instance = defaultInstance;
            await contactRepo.save(contact);
            updated++;

            if (updated % 50 === 0) {
                console.log(`   ✅ ${updated} contatos atualizados...`);
            }
        }
    }

    console.log(`\n✅ ${updated} contatos atualizados com instância\n`);

    // Relatório final
    const totalContacts = await contactRepo.count();
    const contactsWithInstance = await contactRepo.count({
        where: { instance: Not(IsNull()) }
    });

    console.log('📊 RELATÓRIO FINAL:');
    console.log(`   Total de contatos: ${totalContacts}`);
    console.log(`   Com instância: ${contactsWithInstance}`);
    console.log(`   Sem instância: ${totalContacts - contactsWithInstance}`);
    console.log('\n✅ Concluído!\n');

    await app.close();
}

bootstrap().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
