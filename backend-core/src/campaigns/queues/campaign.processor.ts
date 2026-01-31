import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EvolutionApiService } from '../../integrations/evolution-api.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CampaignLead, LeadStatus } from '../entities/campaign-lead.entity';
import { Repository } from 'typeorm';

@Processor('campaign-queue')
export class CampaignProcessor {
    private readonly logger = new Logger(CampaignProcessor.name);
    // Simple in-memory tracker fallback (ideally use Redis)
    private dailyCounts: Record<string, { date: string, count: number }> = {};
    private readonly MAX_DAILY_LIMIT = 40;

    constructor(
        private readonly evolutionApiService: EvolutionApiService,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
    ) { }

    @Process('send-message')
    async handleSendMessage(job: Job) {
        const { leadId, contactId, externalId, message, instanceName, tenantId, variations } = job.data;

        this.logger.log(`Processing job ${job.id} for lead ${leadId} via ${instanceName}`);

        // 1. Rate Limiting Check
        if (!this.checkRateLimit(instanceName)) {
            this.logger.warn(`Rate limit reached for ${instanceName}. Delaying job...`);
            // Delay for 24 hours (in milliseconds)
            await (job as any).moveToDelayed(Date.now() + 24 * 60 * 60 * 1000);
            return;
        }

        // 2. Random Delay (Anti-Ban)
        // Delay between 1 min (60000ms) and 4 min (240000ms)
        const randomDelay = Math.floor(Math.random() * (240000 - 60000 + 1)) + 60000;
        this.logger.log(`Waiting ${Math.round(randomDelay / 1000)}s before sending to ${externalId}...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // 3. AI Variation Logic
        let finalMessage = message;
        if (variations && Array.isArray(variations) && variations.length > 0) {
            // Pick random variation
            const randomIndex = Math.floor(Math.random() * variations.length);
            finalMessage = variations[randomIndex];
            this.logger.log(`Using variation ${randomIndex + 1} for ${externalId}`);
        }

        // 4. Send Message
        try {
            await this.evolutionApiService.sendText(tenantId, instanceName, externalId, finalMessage);

            // Update Lead Status
            if (leadId) {
                await this.leadRepository.update(leadId, { status: LeadStatus.SENT, sentAt: new Date() });
            }

            // Increment Counter
            this.incrementCounter(instanceName);

            this.logger.log(`Message sent successfully to ${externalId}`);
        } catch (error) {
            this.logger.error(`Failed to send message to ${externalId}: ${error.message}`);
            if (leadId) {
                await this.leadRepository.update(leadId, { status: LeadStatus.FAILED });
            }
            // Retry logic usually handled by Bull
            throw error;
        }
    }

    private checkRateLimit(instanceName: string): boolean {
        const today = new Date().toISOString().split('T')[0];
        if (!this.dailyCounts[instanceName] || this.dailyCounts[instanceName].date !== today) {
            this.dailyCounts[instanceName] = { date: today, count: 0 };
        }

        if (this.dailyCounts[instanceName].count >= this.MAX_DAILY_LIMIT) {
            return false;
        }
        return true;
    }

    private incrementCounter(instanceName: string) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.dailyCounts[instanceName] || this.dailyCounts[instanceName].date !== today) {
            this.dailyCounts[instanceName] = { date: today, count: 0 };
        }
        this.dailyCounts[instanceName].count++;
        this.logger.log(`Daily count for ${instanceName}: ${this.dailyCounts[instanceName].count}/${this.MAX_DAILY_LIMIT}`);
    }
}
