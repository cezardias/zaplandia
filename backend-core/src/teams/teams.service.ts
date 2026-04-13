import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { CrmService } from '../crm/crm.service';

@Injectable()
export class TeamsService implements OnModuleInit {
    private readonly logger = new Logger(TeamsService.name);

    constructor(
        @InjectRepository(Team)
        private teamsRepository: Repository<Team>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private crmService: CrmService,
    ) { }

    async onModuleInit() {
        this.logger.log('Iniciando migração manual da tabela de Equipes...');
        const queryRunner = this.teamsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        try {
            // Create teams table if not exists
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "teams" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "name" VARCHAR(255) NOT NULL,
                    "tenantId" UUID NOT NULL,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
                )
            `);
            
            // Add teamId to users if not exists
            await queryRunner.query(`
                ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "teamId" UUID
            `);

            this.logger.log('Migração manual de Equipes concluída com sucesso.');
        } catch (error) {
            this.logger.error('Erro na migração manual de Equipes:', error);
        } finally {
            await queryRunner.release();
        }
    }

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
        let contact;
        // Check if contactId is a valid UUID (Fixes 500 Error when phone number is sent)
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(contactId);
        
        if (isUuid) {
            contact = await this.crmService.findOneById(tenantId, contactId);
        } else {
            this.logger.log(`[TEAM_TRANSFER] Attempting to resolve contact by externalId: ${contactId}`);
            contact = await this.crmService.findOneByExternalId(tenantId, contactId);
        }

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
