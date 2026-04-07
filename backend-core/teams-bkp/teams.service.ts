import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../crm/entities/crm.entity';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team)
        private teamRepository: Repository<Team>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
    ) { }

    async findAll(tenantId: string) {
        return this.teamRepository.find({
            where: { tenantId },
            relations: ['members'],
        });
    }

    async create(tenantId: string, name: string) {
        const team = this.teamRepository.create({ name, tenantId });
        return this.teamRepository.save(team);
    }

    async delete(id: string, tenantId: string) {
        return this.teamRepository.delete({ id, tenantId });
    }

    async assignUserToTeam(userId: string, teamId: string | null, tenantId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId, tenantId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        user.teamId = teamId;
        return this.userRepository.save(user);
    }

    async transferContact(tenantId: string, contactId: string, teamId: string | null, userId: string | null) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId, tenantId } });
        if (!contact) throw new NotFoundException('Contato não encontrado');

        contact.assignedTeamId = teamId;
        contact.assignedUserId = userId;
        
        // When transferring to human, disable bot/n8n automation for THIS contact
        contact.aiEnabled = false;
        contact.n8nEnabled = false;

        return this.contactRepository.save(contact);
    }
}
