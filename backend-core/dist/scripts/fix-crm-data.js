"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const typeorm_1 = require("@nestjs/typeorm");
const crm_entity_1 = require("../crm/entities/crm.entity");
const campaign_lead_entity_1 = require("../campaigns/entities/campaign-lead.entity");
const typeorm_2 = require("typeorm");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const contactRepo = app.get((0, typeorm_1.getRepositoryToken)(crm_entity_1.Contact));
    const leadRepo = app.get((0, typeorm_1.getRepositoryToken)(campaign_lead_entity_1.CampaignLead));
    console.log('🔧 Iniciando correção do CRM...\n');
    console.log('📝 PASSO 1: Atualizando nomes dos contatos...');
    const contactsWithBadNames = await contactRepo
        .createQueryBuilder('c')
        .where("c.name LIKE 'Novo Contato%' OR c.name LIKE 'Contato%' OR c.name LIKE '%@%'")
        .andWhere('c.externalId IS NOT NULL')
        .getMany();
    console.log(`   Encontrados ${contactsWithBadNames.length} contatos com nomes ruins`);
    let namesFixed = 0;
    for (const contact of contactsWithBadNames) {
        const lead = await leadRepo
            .createQueryBuilder('l')
            .where('l.externalId = :externalId', { externalId: contact.externalId })
            .orWhere('RIGHT(l.externalId, 8) = RIGHT(:externalId, 8)', { externalId: contact.externalId })
            .andWhere("l.name IS NOT NULL AND l.name NOT LIKE '%@%'")
            .orderBy('l.createdAt', 'DESC')
            .getOne();
        if (lead && lead.name) {
            contact.name = lead.name;
            await contactRepo.save(contact);
            namesFixed++;
            console.log(`   ✅ ${contact.externalId} → ${lead.name}`);
        }
    }
    console.log(`   ✅ ${namesFixed} nomes corrigidos\n`);
    console.log('🗑️  PASSO 2: Removendo duplicatas...');
    const allContacts = await contactRepo.find({ order: { createdAt: 'ASC' } });
    const seenSuffixes = new Map();
    let duplicatesRemoved = 0;
    for (const contact of allContacts) {
        const identifier = contact.externalId || contact.phoneNumber;
        if (!identifier || identifier.length < 8)
            continue;
        const suffix = identifier.slice(-8);
        if (seenSuffixes.has(suffix)) {
            const keepContact = seenSuffixes.get(suffix);
            console.log(`   🔄 Migrando mensagens de "${contact.name}" para "${keepContact.name}"`);
            await contactRepo.query(`UPDATE messages SET "contactId" = $1 WHERE "contactId" = $2`, [keepContact.id, contact.id]);
            await contactRepo.delete(contact.id);
            duplicatesRemoved++;
            console.log(`   🗑️  Removido: ${contact.name} (${suffix})`);
        }
        else {
            seenSuffixes.set(suffix, contact);
        }
    }
    if (duplicatesRemoved > 0) {
        console.log(`   ✅ ${duplicatesRemoved} duplicatas removidas\n`);
    }
    else {
        console.log(`   ✅ Nenhuma duplicata encontrada\n`);
    }
    console.log('📊 RELATÓRIO FINAL:');
    const totalContacts = await contactRepo.count();
    const contactsWithInstance = await contactRepo.count({ where: { instance: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) } });
    const contactsWithGoodNames = await contactRepo
        .createQueryBuilder('c')
        .where("c.name NOT LIKE 'Novo Contato%' AND c.name NOT LIKE 'Contato%' AND c.name NOT LIKE '%@%'")
        .getCount();
    console.log(`   Total de contatos: ${totalContacts}`);
    console.log(`   Com instância: ${contactsWithInstance}`);
    console.log(`   Com nomes válidos: ${contactsWithGoodNames}`);
    console.log('\n✅ Correção concluída!\n');
    await app.close();
}
bootstrap().catch(err => {
    console.error('❌ Erro ao executar script:', err);
    process.exit(1);
});
//# sourceMappingURL=fix-crm-data.js.map