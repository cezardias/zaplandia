import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Contact, Message } from '../crm/entities/crm.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Controller('debug-audit')
export class DebugAuditController {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Contact) private readonly contactRepo: Repository<Contact>,
        @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
        @InjectRepository(Integration) private readonly integrationRepo: Repository<Integration>,
        @InjectRepository(Campaign) private readonly campaignRepo: Repository<Campaign>,
    ) {}

    @Get('counts')
    async getCounts() {
        return {
            users: await this.userRepo.count(),
            contacts: await this.contactRepo.count(),
            messages: await this.messageRepo.count(),
            integrations: await this.integrationRepo.count(),
            campaigns: await this.campaignRepo.count(),
            timestamp: new Date().toISOString()
        };
    }

    @Get('detail')
    async getDetail() {
        return {
            users: await this.userRepo.find({ select: ['id', 'email', 'tenantId'], take: 5 }),
            integrations: await this.integrationRepo.find({ select: ['id', 'tenantId', 'provider'], take: 5 }),
            credentials: await this.integrationRepo.manager.query('SELECT key_name, "tenantId" FROM api_credential LIMIT 10')
        };
    }

    @Get('meta-tokens')
    async getMetaTokens() {
        const query = await this.integrationRepo.manager.query(`SELECT key_name, key_value FROM api_credential WHERE key_name LIKE '%TOKEN%' AND "tenantId" = 'd9f1a1e0-e13c-4205-9cb7-8fd8a22ef0c9'`);
        return query.map((q: any) => ({
            key: q.key_name,
            rawString: q.key_value,
            length: q.key_value ? q.key_value.length : 0,
            hasSpaces: q.key_value ? q.key_value.includes(' ') : false,
            startsWith: q.key_value ? q.key_value.substring(0, 10) : 'none'
        }));
    }
}
