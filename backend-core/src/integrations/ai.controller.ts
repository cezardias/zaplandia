import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @UseGuards(JwtAuthGuard)
    @Post('generate-variations')
    async generateVariations(@Request() req, @Body() body: { baseMessage: string, prompt?: string, count?: number }) {
        return this.aiService.generateVariations(
            req.user.tenantId,
            body.baseMessage,
            body.prompt,
            body.count || 3
        );
    }
}
