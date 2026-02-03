import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from '../integrations/entities/integration.entity';
import { Contact } from '../crm/entities/crm.entity';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
    ) { }

    /**
     * Toggle AI for an integration (instance)
     */
    @Post('integration/:id/toggle')
    async toggleIntegrationAI(
        @Param('id') integrationId: string,
        @Body() body: { enabled: boolean; promptId?: string },
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

        await this.integrationRepository.save(integration);

        return {
            success: true,
            integration: {
                id: integration.id,
                aiEnabled: integration.aiEnabled,
                aiPromptId: integration.aiPromptId
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
}
