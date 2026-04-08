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
            credentials: await this.integrationRepo.manager.query('SELECT key, "tenantId" FROM api_credentials LIMIT 10')
        };
    }
}
