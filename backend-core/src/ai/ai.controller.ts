import { Controller, Post, Get, Param, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration, IntegrationProvider, IntegrationStatus } from '../integrations/entities/integration.entity';
import { Contact } from '../crm/entities/crm.entity';
import axios from 'axios';
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

    @Get('openrouter/models')
    async listOpenRouterModels() {
        return this.aiService.getOpenRouterModels();
    }

    @Get('openrouter/credits')
    async getOpenRouterCredits(@Request() req) {
        const apiKey = await (this.aiService as any).getOpenRouterApiKey(req.user.tenantId);
        if (!apiKey) return { error: 'No OpenRouter API key configured' };
        return this.aiService.getOpenRouterCredits(apiKey);
    }

    /**
     * DIAGNOSTIC: List all Gemini models available for this tenant's API key
     * GET /api/ai/list-models
     */
    @Get('list-models')
    async listModels(@Request() req) {
        try {
            // Get API key via aiService (reusing the private method indirectly)
            const variations = await this.aiService.generateVariations(
                req.user.tenantId, '__TEST__', undefined, 0
            );
            // Actually call ListModels directly
            const apiKey = await (this.aiService as any).getGeminiApiKey(req.user.tenantId);
            if (!apiKey) return { error: 'No API key configured' };

            const response = await axios.get(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}&pageSize=50`
            );

            const models = response.data?.models || [];
            const generateContentModels = models
                .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                .map((m: any) => ({ name: m.name, displayName: m.displayName, version: m.version }));

            return {
                totalModels: models.length,
                generateContentModels,
                allModels: models.map((m: any) => m.name)
            };
        } catch (error) {
            return {
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }

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

    // --- MANUAL PROMPT CRUD ---

    @Post('prompts/save')
    async savePrompt(
        @Body() body: { id?: string; name: string; content: string },
        @Request() req
    ) {
        try {
            if (body.id) {
                // Update
                const updated = await this.aiService.updatePrompt(req.user.tenantId, body.id, {
                    name: body.name,
                    content: body.content
                });
                return { success: true, prompt: updated };
            } else {
                // Create
                const created = await this.aiService.createPrompt(req.user.tenantId, body.name, body.content);
                return { success: true, prompt: created };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    @Delete('prompts/:id')
    async deletePrompt(@Param('id') id: string, @Request() req) {
        try {
            await this.aiService.deletePrompt(req.user.tenantId, id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}
