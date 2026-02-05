import { Controller, Get, UseGuards, Request, Post, Query, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Contact, Message } from '../crm/entities/crm.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IntegrationsService } from '../integrations/integrations.service';
import { EvolutionApiService } from '../integrations/evolution-api.service';
import { Integration } from '../integrations/entities/integration.entity';

@Controller('debug')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN) // Only superadmin can access debug tools
export class DebugController {
    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        private integrationsService: IntegrationsService,
        private evolutionApiService: EvolutionApiService,
    ) { }

    @Get('instances')
    async getInstanceStats(@Request() req) {
        const tenantId = req.user.tenantId;

        // Contar contatos por instância
        const instanceCounts = await this.contactRepository
            .createQueryBuilder('contact')
            .select('contact.instance', 'instance')
            .addSelect('COUNT(*)', 'count')
            .where('contact.tenantId = :tenantId', { tenantId })
            .groupBy('contact.instance')
            .getRawMany();

        // Buscar alguns exemplos de contatos com e sem instância
        const withInstance = await this.contactRepository.find({
            where: { tenantId, instance: Not(IsNull()) },
            take: 5,
            order: { createdAt: 'DESC' }
        });

        const withoutInstance = await this.contactRepository.find({
            where: { tenantId, instance: IsNull() },
            take: 5,
            order: { createdAt: 'DESC' }
        });

        return {
            summary: instanceCounts,
            examples: {
                withInstance: withInstance.map(c => ({
                    id: c.id,
                    name: c.name,
                    instance: c.instance,
                    createdAt: c.createdAt
                })),
                withoutInstance: withoutInstance.map(c => ({
                    id: c.id,
                    name: c.name,
                    instance: c.instance,
                    createdAt: c.createdAt
                }))
            }
        };
    }

    @Post('force-update-instances')
    async forceUpdateInstances(@Request() req) {
        const tenantId = req.user.tenantId;

        // Buscar todos os contatos sem instância
        const contactsWithoutInstance = await this.contactRepository.find({
            where: { tenantId, instance: IsNull() }
        });

        // Atualizar todos com a instância padrão
        const defaultInstance = `tenant_${tenantId}_zaplandia_01`;

        for (const contact of contactsWithoutInstance) {
            contact.instance = defaultInstance;
        }

        await this.contactRepository.save(contactsWithoutInstance);

        return {
            message: `Atualizados ${contactsWithoutInstance.length} contatos com instância ${defaultInstance}`,
            updated: contactsWithoutInstance.length
        };
    }

    @Post('sync-evolution-instances')
    async syncEvolutionInstances(@Request() req) {
        const tenantId = req.user.tenantId;

        // Get instances from Evolution API
        const instances = await this.evolutionApiService.listInstances(tenantId);

        const results: any[] = [];

        for (const inst of instances) {
            const instanceName = inst.name || inst.instance?.instanceName || inst.instanceName;

            // Check if integration already exists
            const existing = await this.integrationRepository.findOne({
                where: {
                    tenantId,
                    provider: 'evolution' as any,
                    settings: { instanceName } as any
                }
            });

            if (!existing) {
                // Create new integration
                const integration = await this.integrationsService.create(
                    tenantId,
                    'evolution' as any,
                    { instanceName, syncedFromEvolution: true }
                );
                results.push({ instanceName, action: 'created', id: integration.id });
            } else {
                results.push({ instanceName, action: 'already_exists', id: existing.id });
            }
        }

        return {
            message: 'Sincronização concluída',
            results
        };
    }

    @Post('backfill-instances')
    async backfillInstances(@Request() req) {
        const tenantId = req.user.tenantId;

        // 1. Get all contacts with an instance set
        const contactsWithInstance = await this.contactRepository.find({
            where: { tenantId, instance: Not(IsNull()) }
        });

        let totalUpdated = 0;

        for (const contact of contactsWithInstance) {
            if (!contact.instance) continue;

            const result = await this.messageRepository.createQueryBuilder()
                .update('messages')
                .set({ instance: contact.instance })
                .where('contactId = :contactId', { contactId: contact.id })
                .andWhere('instance IS NULL')
                .execute();

            totalUpdated += (result.affected || 0);
        }

        return {
            message: `Backfill completed. Updated ${totalUpdated} messages across ${contactsWithInstance.length} contacts.`,
            updatedMessages: totalUpdated,
            contactsProcessed: contactsWithInstance.length
        };
    }
}
