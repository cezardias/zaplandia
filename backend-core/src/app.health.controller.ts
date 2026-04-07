import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Contact } from './crm/entities/crm.entity';
import { SupportArticle } from './support/entities/support-article.entity';

@Controller('health-debug')
export class HealthDebugController {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Contact) private contactRepo: Repository<Contact>,
        @InjectRepository(SupportArticle) private supportRepo: Repository<SupportArticle>,
    ) {}

    @Get()
    async getStatus() {
        try {
            const users = await this.userRepo.count();
            const contacts = await this.contactRepo.count();
            const articles = await this.supportRepo.count();
            
            return {
                status: 'ok',
                counts: {
                    users,
                    contacts,
                    articles
                },
                timestamp: new Date().toISOString()
            };
        } catch (err) {
            return {
                status: 'error',
                error: err.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}
