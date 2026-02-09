import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration, IntegrationProvider, IntegrationStatus } from '../integrations/entities/integration.entity';
import { Contact } from '../crm/entities/crm.entity';

import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        private aiService: AiService,
    ) { }

    /**
     * Toggle AI for an integration (instance)
     */
    @Post('integration/:id/toggle')
    async toggleIntegrationAI(
        @Param('id') integrationId: string,
        @Body() body: { enabled: boolean; promptId?: string; aiModel?: string },
        @Request() req
    ) {
        let integration: Integration | null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(integrationId);

        if (isUuid) {
            integration = await this.integrationRepository.findOne({
                where: { id: integrationId, tenantId: req.user.tenantId }
            });
        } else {
            // It's likely an Evolution Instance Name (string) e.g. "tenant_xyz"
            // Search for existing integration by instanceName in settings or credentials
            integration = await this.integrationRepository.createQueryBuilder('integration')
                .where('integration.tenantId = :tenantId', { tenantId: req.user.tenantId })
                .andWhere(`integration.provider = 'evolution'`)
                .andWhere(`(integration.settings->>'instanceName' = :instanceName OR integration.credentials->>'instanceName' = :instanceName)`, { instanceName: integrationId })
                .getOne();
        }

        if (!integration) {
            // If not found and it looks like a valid evolution instance name, create it
            if (!isUuid && integrationId.startsWith('tenant_')) {
                const newIntegration = this.integrationRepository.create({
                    tenantId: req.user.tenantId,
                    provider: IntegrationProvider.EVOLUTION,
                    status: IntegrationStatus.CONNECTED,
                    settings: { instanceName: integrationId },
                    aiEnabled: body.enabled,
                    aiPromptId: body.promptId,
                    aiModel: body.aiModel
                });
                await this.integrationRepository.save(newIntegration);

                return {
                    success: true,
                    integration: {
                        id: newIntegration.id,
                        aiEnabled: newIntegration.aiEnabled,
                        aiPromptId: newIntegration.aiPromptId,
                        aiModel: newIntegration.aiModel
                    }
                };
            }

            return { success: false, message: 'Integration not found' };
        }

        integration.aiEnabled = body.enabled;

        // CHECK: Explicitly check for undefined to allow setting null/empty
        if (body.promptId !== undefined) {
            integration.aiPromptId = body.promptId;
        }
        if (body.aiModel) {
            integration.aiModel = body.aiModel;
        }

        await this.integrationRepository.save(integration);

        return {
            success: true,
            integration: {
                id: integration.id,
                aiEnabled: integration.aiEnabled,
                aiPromptId: integration.aiPromptId,
                aiModel: integration.aiModel
            }
        };
    }

    /**
     * Toggle AI for a specific contact (conversation)
     */
    @Post('contact/:id/toggle')
    async toggleContactAI(
        @Param('id') contactId: string,
        @Body() body: { enabled: boolean | null },
        @Request() req
    ) {
        const contact = await this.contactRepository.findOne({
            where: { id: contactId, tenantId: req.user.tenantId }
        });

        if (!contact) {
            return { success: false, message: 'Contact not found' };
        }

        contact.aiEnabled = body.enabled as boolean | null;
        await this.contactRepository.save(contact);

        return {
            success: true,
            contact: {
                id: contact.id,
                aiEnabled: contact.aiEnabled
            }
        };
    }
    @Post('generate-variations')
    async generateVariations(
        @Body() body: { baseMessage: string; prompt?: string; count?: number },
        @Request() req
    ) {
        const variations = await this.aiService.generateVariations(
            req.user.tenantId,
            body.baseMessage,
            body.prompt,
            body.count
        );
        return { success: true, variations };
    }

    @Get('prompts')
    async getPrompts(@Request() req) {
        return this.aiService.findAll(req.user.tenantId);
    }

    @Post('prompts')
    async generatePrompts(
        @Body() body: { topic: string; count?: number },
        @Request() req
    ) {
        const prompts = await this.aiService.generatePrompts(
            req.user.tenantId,
            body.topic,
            body.count
        );
        return { success: true, prompts };
    }
}
