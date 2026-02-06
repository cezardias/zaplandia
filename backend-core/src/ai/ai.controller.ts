import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from '../integrations/entities/integration.entity';
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
        const integration = await this.integrationRepository.findOne({
            where: { id: integrationId, tenantId: req.user.tenantId }
        });

        if (!integration) {
            return { success: false, message: 'Integration not found' };
        }

        integration.aiEnabled = body.enabled;
        if (body.promptId) {
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
