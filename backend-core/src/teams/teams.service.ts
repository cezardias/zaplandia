import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { CrmService } from '../crm/crm.service';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team)
        private teamsRepository: Repository<Team>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private crmService: CrmService,
    ) { }

    async findAll(tenantId: string) {
        return this.teamsRepository.find({
            where: { tenantId },
            relations: ['members'],
            order: { name: 'ASC' }
        });
    }

    async create(tenantId: string, name: string) {
        const team = this.teamsRepository.create({ name, tenantId });
        return this.teamsRepository.save(team);
    }

    async remove(tenantId: string, id: string) {
        const team = await this.teamsRepository.findOne({ where: { id, tenantId } });
        if (!team) throw new NotFoundException('Equipe não encontrada.');
        return this.teamsRepository.remove(team);
    }

    async assignUserToTeam(tenantId: string, userId: string, teamId: string | null) {
        const user = await this.usersRepository.findOne({ where: { id: userId, tenantId } });
        if (!user) throw new NotFoundException('Usuário não encontrado.');
        
        user.teamId = teamId;
        return this.usersRepository.save(user);
    }

    async transferContact(tenantId: string, contactId: string, target: { teamId?: string, userId?: string }) {
        const contact = await this.crmService.findOneById(tenantId, contactId);
        if (!contact) throw new NotFoundException('Contato não encontrado.');

        const updateData: any = {
            assignedTeamId: target.teamId || null,
            assignedUserId: target.userId || null,
            // Automatically disable automation when transferred to a human/team queue as requested
            aiEnabled: false,
            n8nEnabled: false
        };

        return this.crmService.updateContact(tenantId, contactId, updateData);
    }
}
