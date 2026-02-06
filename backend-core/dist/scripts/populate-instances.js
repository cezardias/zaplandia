"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const typeorm_1 = require("@nestjs/typeorm");
const crm_entity_1 = require("../crm/entities/crm.entity");
const crm_entity_2 = require("../crm/entities/crm.entity");
const typeorm_2 = require("typeorm");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const contactRepo = app.get((0, typeorm_1.getRepositoryToken)(crm_entity_1.Contact));
    const messageRepo = app.get((0, typeorm_1.getRepositoryToken)(crm_entity_2.Message));
    console.log('🔧 Populando instâncias nos contatos...\n');
    const contactsWithoutInstance = await contactRepo.find({
        where: { instance: (0, typeorm_2.IsNull)() }
    });
    console.log(`📝 Encontrados ${contactsWithoutInstance.length} contatos sem instância`);
    let updated = 0;
    for (const contact of contactsWithoutInstance) {
        const firstMessage = await messageRepo.findOne({
            where: { contactId: contact.id },
            order: { createdAt: 'ASC' }
        });
        if (firstMessage && firstMessage.provider === 'whatsapp') {
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
    const totalContacts = await contactRepo.count();
    const contactsWithInstance = await contactRepo.count({
        where: { instance: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) }
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
//# sourceMappingURL=populate-instances.js.map