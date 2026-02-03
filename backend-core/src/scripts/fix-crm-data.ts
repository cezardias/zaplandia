import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../crm/entities/crm.entity';
import { CampaignLead } from '../campaigns/entities/campaign-lead.entity';
import { Repository, Not, IsNull } from 'typeorm';

/**
 * Script para corrigir dados do CRM:
 * 1. Atualizar nomes de contatos usando dados de campanhas
 * 2. Remover duplicatas
 * 
 * Execute: npm run fix-crm
 */
async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const contactRepo = app.get<Repository<Contact>>(getRepositoryToken(Contact));
    const leadRepo = app.get<Repository<CampaignLead>>(getRepositoryToken(CampaignLead));

    console.log('🔧 Iniciando correção do CRM...\n');

    // PASSO 1: Atualizar nomes dos contatos
    console.log('📝 PASSO 1: Atualizando nomes dos contatos...');
    const contactsWithBadNames = await contactRepo
        .createQueryBuilder('c')
        .where("c.name LIKE 'Novo Contato%' OR c.name LIKE 'Contato%' OR c.name LIKE '%@%'")
        .andWhere('c.externalId IS NOT NULL')
        .getMany();

    console.log(`   Encontrados ${contactsWithBadNames.length} contatos com nomes ruins`);

    let namesFixed = 0;
    for (const contact of contactsWithBadNames) {
        // Buscar nome real na tabela de leads
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

    // PASSO 2: Remover duplicatas
    console.log('🗑️  PASSO 2: Removendo duplicatas...');
    const allContacts = await contactRepo.find({ order: { createdAt: 'ASC' } });

    const seenSuffixes = new Map<string, Contact>();
    const toDelete: string[] = [];

    for (const contact of allContacts) {
        const identifier = contact.externalId || contact.phoneNumber;
        if (!identifier || identifier.length < 8) continue;

        const suffix = identifier.slice(-8);

        if (seenSuffixes.has(suffix)) {
            // Duplicata encontrada - marcar para deletar
            toDelete.push(contact.id);
            console.log(`   🗑️  Removendo duplicata: ${contact.name} (${suffix})`);
        } else {
            // Primeira ocorrência - manter
            seenSuffixes.set(suffix, contact);
        }
    }

    if (toDelete.length > 0) {
        await contactRepo.delete(toDelete);
        console.log(`   ✅ ${toDelete.length} duplicatas removidas\n`);
    } else {
        console.log(`   ✅ Nenhuma duplicata encontrada\n`);
    }

    // PASSO 3: Relatório final
    console.log('📊 RELATÓRIO FINAL:');
    const totalContacts = await contactRepo.count();
    const contactsWithInstance = await contactRepo.count({ where: { instance: Not(IsNull()) } });
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
