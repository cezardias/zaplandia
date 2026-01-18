import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CrmService } from '../crm/crm.service';
import { AiService } from '../integrations/ai.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly crmService: CrmService,
        private readonly aiService: AiService,
        private readonly integrationsService: IntegrationsService,
    ) { }

    // Meta (Face/Insta/WhatsApp) Webhook verification
    @Get('meta')
    verifyMeta(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
        this.logger.log('Verifying Meta Webhook...');
        if (mode === 'subscribe' && token === 'zaplandia_verify_token') {
            return challenge;
        }
        return 'Forbidden';
    }

    // Handle Meta payloads
    @Post('meta')
    @HttpCode(HttpStatus.OK)
    async handleMeta(@Body() payload: any) {
        this.logger.log('Received Meta Payload');

        // Simplistic extraction logic for demo
        // In production, we iterate through entry[] -> changes[] -> value -> messages[]
        try {
            if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
                const msg = payload.entry[0].changes[0].value.messages[0];
                const contactInfo = payload.entry[0].changes[0].value.contacts?.[0];

                // 1. Process Message (Save to CRM)
                // Hardcoded tenantId for demo/main account
                const tenantId = "default-tenant";

                // This would normally find/create contact and save message
                this.logger.log(`Message from ${contactInfo?.wa_id}: ${msg.text?.body}`);

                // 2. IA Auto-Reply (If enabled)
                const aiReply = await this.aiService.getAiResponse(msg.text?.body);
                this.logger.log(`AI want to reply: ${aiReply}`);

                // 3. TODO: Actually send message back using Meta API
            }
        } catch (e) {
            this.logger.error('Error processing webhook', e.stack);
        }

        return { status: 'received' };
    }
}
