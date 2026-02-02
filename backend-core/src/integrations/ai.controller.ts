import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @UseGuards(JwtAuthGuard)
    @Post('prompts')
    async createPrompt(@Request() req, @Body() body: { name: string, content: string }) {
        return this.aiService.createPrompt(req.user.tenantId, body.name, body.content);
    }

    @UseGuards(JwtAuthGuard)
    @Get('prompts')
    async getPrompts(@Request() req) {
        return this.aiService.findAllPrompts(req.user.tenantId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('generate-variations')
    async generateVariations(@Request() req, @Body() body: { baseMessage: string, prompt?: string, count?: number }) {
        const tenantId = req.user.tenantId || req.user.id; // Fallback to userId if tenantId missing from older tokens
        console.log(`[AI_CONTROLLER] Generating variations for tenant ${tenantId}`);

        return this.aiService.generateVariations(
            tenantId,
            body.baseMessage,
            body.prompt,
            body.count || 3
        );
    }
}
