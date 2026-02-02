import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EvolutionApiService } from '../../integrations/evolution-api.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { CrmService } from '../../crm/crm.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CampaignLead, LeadStatus } from '../entities/campaign-lead.entity';
import { Campaign } from '../entities/campaign.entity';
import { Repository } from 'typeorm';

@Processor('campaign-queue')
export class CampaignProcessor {
    private readonly logger = new Logger(CampaignProcessor.name);
    // Simple in-memory tracker fallback (ideally use Redis)
    private dailyCounts: Record<string, { date: string, count: number }> = {};
    private readonly MAX_DAILY_LIMIT = 40;

    constructor(
        private readonly integrationsService: IntegrationsService,
        private readonly evolutionApiService: EvolutionApiService,
        private readonly crmService: CrmService,
        @InjectRepository(Campaign)
        private campaignRepository: Repository<Campaign>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
    ) { }

    @Process('send-message')
    async handleSendMessage(job: Job) {
        const { leadId, contactId, campaignId, externalId, message, instanceName, tenantId, variations } = job.data;
        this.logger.log(`Processing job ${job.id} for lead ${leadId} (External: ${externalId})`);

        if (!instanceName || (!message && (!variations || variations.length === 0))) {
            this.logger.error(`Missing instanceName or message for job ${job.id}`);
            return;
        }

        // 1. Rate Limiting Check
        if (!this.checkRateLimit(instanceName)) {
            this.logger.warn(`Rate limit reached for ${instanceName}. Delaying job...`);
            // Delay for 24 hours (in milliseconds)
            await (job as any).moveToDelayed(Date.now() + 24 * 60 * 60 * 1000);
            return;
        }

        // Fetch campaign to check status
        if (campaignId) {
            const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
            if (campaign && campaign.status === 'paused') {
                this.logger.warn(`Campaign ${campaignId} is paused. Re-queuing job ${job.id}`);
                await (job as any).moveToDelayed(60000); // Check again in 1 min
                return;
            }
        }

        // 2. Random Delay (Anti-Ban)
        // Staggering:
        // Decrease random delay to 10-30 seconds for faster testing, but still anti-ban safe-ish
        const randomDelay = Math.floor(Math.random() * 20000) + 10000; // Delay between 10s (10000ms) and 30s (30000ms)
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

            // Update Contact Pipeline Stage (Automated)
            if (contactId) {
                await this.crmService.updateContact(tenantId, contactId, { stage: 'CONTACTED' });
                this.logger.log(`Updated contact ${contactId} stage to CONTACTED`);
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
