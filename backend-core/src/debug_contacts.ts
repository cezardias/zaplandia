import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CrmService } from './crm/crm.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from './crm/entities/crm.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const repo = app.get<Repository<Contact>>(getRepositoryToken(Contact));
    
    const contacts = await repo.find();
    console.log(`TOTAL CONTACTS: ${contacts.length}`);
    
    const cezarContacts = contacts.filter(c => c.name?.includes('Cezar'));
    console.log('CEZAR CONTACTS:');
    cezarContacts.forEach(c => {
        console.log(`ID: ${c.id}, Name: [${c.name}], Tenant: [${c.tenantId}], ExtId: [${c.externalId}], AI: ${c.aiEnabled}, N8N: ${c.n8nEnabled}`);
    });
    
    await app.close();
}
bootstrap();
