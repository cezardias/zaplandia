import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { ContactList } from './entities/contact-list.entity';
import { CampaignLead, LeadStatus } from './entities/campaign-lead.entity';
import { CrmService } from '../crm/crm.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { IntegrationProvider } from '../integrations/entities/integration.entity';

@Injectable()
export class CampaignsService {
    private readonly logger = new Logger(CampaignsService.name);

    constructor(
        @InjectRepository(Campaign)
        private campaignRepository: Repository<Campaign>,
        @InjectRepository(CampaignLead)
        private leadRepository: Repository<CampaignLead>,
        @InjectRepository(ContactList)
        private contactListRepository: Repository<ContactList>,
        private crmService: CrmService,
        private integrationsService: IntegrationsService,
        @InjectQueue('campaign-queue') private campaignQueue: Queue,
        private usageService: UsageService,
        private auditService: AuditService,
    ) { }

    private async resolveInstanceName(integrationId: string, tenantId: string): Promise<string | null> {
        // Check if it's a UUID
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(integrationId);

        if (isUuid) {
            const integration = await this.integrationsService.findOne(integrationId, tenantId);
            if (!integration) return null;

            const val = integration.credentials?.instanceName ||
                integration.settings?.instanceName ||
                integration.credentials?.name ||
                integration.credentials?.instance ||
                integration.settings?.name || null;
            return val ? val.trim() : null;
        }

        // If not UUID, assume it's the direct name
        return integrationId.trim();
    }

    // Contact List (Funnel) Methods
    async createContactList(tenantId: string, name: string, contacts: any[]) {
        const list = this.contactListRepository.create({
            tenantId,
            name,
            contacts
        });
        return this.contactListRepository.save(list);
    }

    async getContactLists(tenantId: string) {
        return this.contactListRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
    }

    async removeContactList(id: string, tenantId: string) {
        const list = await this.contactListRepository.findOne({ where: { id, tenantId } });
        if (list) {
            return this.contactListRepository.remove(list);
        }
    }

    async updateContactList(id: string, tenantId: string, data: any) {
        const list = await this.contactListRepository.findOne({ where: { id, tenantId } });
        if (list) {
            list.name = data.name;
            if (data.contacts) {
                list.contacts = data.contacts;
            }
            return this.contactListRepository.save(list);
        }
        return null;
    }

    async start(id: string, tenantId: string, userId?: string) {
        const campaign = await this.findOne(id, tenantId);
        if (!campaign) throw new Error('Campanha não encontrada.');
        if (campaign.status === CampaignStatus.RUNNING) throw new Error('Campanha já está rodando.');

        // Resolve Integration to get real instance name & PROVIDER
        const integration = await this.integrationsService.findOne(campaign.integrationId, tenantId);

        // Default to EVOLUTION limit (safety first)
        let dailyLimit = 40;
        let instanceName = 'unknown';

        if (integration) {
            const provider = integration.provider;
            // If Unofficial (Evolution) -> 100 limits per day (Anti-Ban)
            // If Official (WhatsApp Cloud) -> 1000 limits or more
            if (provider === IntegrationProvider.EVOLUTION) {
                dailyLimit = 100;
            } else if (provider === IntegrationProvider.WHATSAPP) {
                dailyLimit = 1000; // Cloud API Tier 1
            } else {
                dailyLimit = 1000; // Other channels
            }

            instanceName = await this.resolveInstanceName(campaign.integrationId, tenantId) || 'unknown';
        } else {
            // Fallback if integration not found but we somehow have ID
            instanceName = await this.resolveInstanceName(campaign.integrationId, tenantId) || 'unknown';
        }

        if (!instanceName || instanceName === 'unknown') {
            this.logger.error(`[MOTOR] Falha ao resolver instanceName para campanha ${id}. integrationId: ${campaign.integrationId}`);
            throw new Error('Nome da instância não encontrado na integração.');
        }

        this.logger.log(`[MOTOR] Campanha ${id} resolvida para instância: ${instanceName}. Limite Diário: ${dailyLimit}`);

        // 🛡️ SECURITY: CHECK REMAINING QUOTA BEFORE FETCHING
        const remainingQuota = await this.usageService.getRemainingQuota(tenantId, instanceName, 'whatsapp_messages', dailyLimit);

        if (remainingQuota <= 0) {
            throw new Error(`Limite diário de ${dailyLimit} envios já atingido para a instância ${instanceName}. Tente novamente amanhã.`);
        }

        // Fetch PENDING leads (Limited by remaining quota)
        // If 79 pending and 40 quota => fetch 40. The other 39 stay pending.
        const leads = await this.leadRepository.find({
            where: { campaignId: id, status: LeadStatus.PENDING },
            take: remainingQuota // ✅ AUTO-BATCHING
        });

        if (!leads || leads.length === 0) {
            // DIAGNOSTICS: Why are there no leads?
            const totalLeads = await this.leadRepository.count({ where: { campaignId: id } });
            const pendingLeads = await this.leadRepository.count({ where: { campaignId: id, status: LeadStatus.PENDING } });

            if (totalLeads === 0) {
                throw new Error('A campanha está vazia! Adicione leads antes de iniciar.');
            }

            if (pendingLeads === 0 && totalLeads > 0) {
                const failed = await this.leadRepository.count({ where: { campaignId: id, status: LeadStatus.FAILED } });
                const sent = await this.leadRepository.count({ where: { campaignId: id, status: LeadStatus.SENT } });
                const invalid = await this.leadRepository.count({ where: { campaignId: id, status: LeadStatus.INVALID } });

                throw new Error(`Todos os ${totalLeads} leads desta campanha já foram processados (Enviados/Pulados: ${sent}, Falhas: ${failed}, Inválidos: ${invalid}). Para enviar novamente para os inválidos ou falhas, você precisa reiniciar os leads desta campanha.`);
            }

            throw new Error(`Não foi possível buscar leads pendentes (Cota: ${remainingQuota}, Pendentes: ${pendingLeads}).`);
        }

        // Update status to RUNNING
        campaign.status = CampaignStatus.RUNNING;
        await this.campaignRepository.save(campaign);

        // 🛡️ SECURITY: AUDIT LOG
        if (userId) {
            await this.auditService.log(tenantId, userId, 'CAMPAIGN_START', {
                campaignId: id,
                campaignName: campaign.name,
                leadsCount: leads.length,
                instanceName
            });
        }

        this.logger.log(`[MOTOR] Iniciando campanha ${id} (${campaign.name}). Enfileirando ${leads.length} leads...`);

        const STAGGER_MS = 25 * 1000; // 25s per message to be safe
        const CHUNK_SIZE = 50;

        for (let i = 0; i < leads.length; i += CHUNK_SIZE) {
            const chunk = leads.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (lead, chunkIndex) => {
                const globalIndex = i + chunkIndex;
                const delay = globalIndex * STAGGER_MS;

                await this.campaignQueue.add('send-message', {
                    leadId: lead.id,
                    leadName: lead.name,
                    campaignId: id,
                    externalId: lead.externalId,
                    message: campaign.messageTemplate,
                    instanceName: instanceName,
                    tenantId: tenantId,
                    variations: campaign.variations,
                    dailyLimit: dailyLimit,
                    isFirst: globalIndex === 0
                }, {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: 5000
                });
            }));
        }

        this.logger.log(`[SUCESSO] Campanha ${id} iniciada com sucesso.`);
        return campaign;
    }

    async pause(id: string, tenantId: string) {
        const campaign = await this.findOne(id, tenantId);
        if (!campaign) throw new Error('Campanha não encontrada.');

        campaign.status = CampaignStatus.PAUSED;
        await this.campaignRepository.save(campaign);
        this.logger.log(`[MOTOR] Campanha ${id} pausada pelo usuário.`);
        return campaign;
    }

    async findAllByTenant(tenantId: string) {
        return this.campaignRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }

    private extractLeadName(l: any): string {
        if (!l) return 'Contato';

        const minNameLength = 3; // Anything shorter is likely noise (like "BR")
        const noiseBlacklist = [
            'BR', 'US', 'PT', 'SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'SC', 'GO', 'DF', 'ES', 'CE', 'PE', 'MA', 'MS', 'MT', 'PA', 'PB', 'PI', 'RN', 'RO', 'RR', 'TO', 'AC', 'AM', 'AL', 'SE',
            'bra', 'usa', 'esp', 'mex', 'can'
        ];

        // 0. Handle raw strings or numbers
        if (typeof l !== 'object') {
            const s = String(l).trim();
            const digitCount = (s.match(/\d/g) || []).length;
            const isNoise = noiseBlacklist.some(n => n.toLowerCase() === s.toLowerCase());

            if (digitCount > 6 || s.includes('@') || isNoise || s.length < minNameLength) return 'Contato';
            return (s && s.toLowerCase() !== 'contato') ? s : 'Contato';
        }

        const keys = Object.keys(l);
        const values = Object.values(l).map(v => v ? String(v).trim() : '');

        // --- TIER 1: Intelligent Key Matching (Whitelist + Blacklist) ---
        const nameKeywords = [
            'name', 'nome', 'fullname', 'completo', 'title', 'titulo', 'título',
            'cliente', 'público', 'publico', 'interessado', 'cli',
            'empresa', 'razão', 'razao', 'raz', 'user', 'usuario', 'usuário',
            'pessoa', 'lead', 'titular', 'destinatario', 'destinatário'
        ];
        const blacklistKeywords = [
            'id', 'uuid', 'guid', 'key', 'token', 'pass', 'senha', 'email', 'mail',
            'phone', 'tel', 'whatsapp', 'created', 'updated', 'deleted', 'external', 'chat', 'country', 'pais', 'páis', 'state', 'estado', 'code', 'codigo', 'código'
        ];

        const candidateKey = keys.find(k => {
            const low = k.toLowerCase().trim();
            // Must be in whitelist AND NOT in blacklist
            const isNameLike = nameKeywords.some(kw => low.includes(kw));
            const isTechnicalOrLocational = blacklistKeywords.some(bk => low.includes(bk));
            return isNameLike && !isTechnicalOrLocational;
        });

        if (candidateKey && l[candidateKey]) {
            const val = String(l[candidateKey]).trim();
            const valDigits = (val.match(/\d/g) || []).length;
            const isNoise = noiseBlacklist.some(n => n.toLowerCase() === val.toLowerCase());

            if (val.length >= minNameLength && valDigits < 6 && val.toLowerCase() !== 'contato' && !val.includes('@') && !isNoise) {
                return val;
            }
        }

        // --- TIER 2: Value Heuristics (Tsar Bomba Deep Analysis) ---
        let bestCandidate = '';
        let bestScore = -100;

        for (const val of values) {
            if (!val || val.length < minNameLength || val.length > 100) continue;
            if (val.toLowerCase() === 'contato') continue;
            if (noiseBlacklist.some(n => n.toLowerCase() === val.toLowerCase())) continue;

            let score = 0;

            // Rules for scoring:
            if (val.includes(' ')) score += 20; // Names usually have spaces
            if (/^[A-Z][a-z]/.test(val)) score += 10; // CamelCase start

            // Penalties
            const digitCount = (val.match(/\d/g) || []).length;
            if (digitCount > 4) score -= 50;
            if (val.includes('@')) score -= 60;
            if (val.includes('-') && !val.includes(' ')) score -= 15;
            if (/^[0-9a-f-]{8,}$/i.test(val)) score -= 40;

            // Bonus for "clean" strings
            if (!val.includes('/') && !val.includes('\\') && !val.includes('_')) score += 10;
            if (val.length > 5 && val.length < 40) score += 5;

            if (score > bestScore) {
                bestScore = score;
                bestCandidate = val;
            }
        }

        // If we found a candidate with a significant score
        if (bestCandidate && bestScore > 15) {
            this.logger.debug(`[TSAR_BOMBA_NAME] Candidate: ${bestCandidate} (Score: ${bestScore}) from Object: ${JSON.stringify(l)}`);
            return bestCandidate;
        }

        // --- TIER 3: Last Resort ---
        this.logger.debug(`[BOMBA_STILL_FAILING] Best was: ${bestCandidate} (Score: ${bestScore}). Full Object: ${JSON.stringify(l)}`);

        // Check if there is ANY string that isn't technical and not noise
        const fallback = values.find(v => {
            const d = (v.match(/\d/g) || []).length;
            const isNoise = noiseBlacklist.some(n => n.toLowerCase() === v.toLowerCase());
            return v.length >= minNameLength && d < 4 && !v.includes('@') && v.toLowerCase() !== 'contato' && !isNoise;
        });

        if (fallback) return fallback;

        return 'Contato';
    }

    // Helper to normalize phone numbers (standardize to E.164-like)
    private normalizePhoneNumber(raw: string): string {
        let sanitized = raw.replace(/\D/g, ''); // Remove non-digits
        if (sanitized.startsWith('0')) sanitized = sanitized.substring(1); // Strip leading zero

        // If 10 or 11 digits, assume Brazil and prepend 55
        if (sanitized.length === 10 || sanitized.length === 11) {
            sanitized = '55' + sanitized;
        }

        return sanitized;
    }

    // Helper to extract phone robustly
    private extractPhoneNumber(l: any): string {
        const phoneKeys = [
            'phoneNumber', 'telefone', 'phone', 'celular', 'externalId', 'whatsapp', 'wa', 'number', 'numero', 'tel', 'cell',
            'Phone', 'Telefone', 'Celular', 'Número', 'Numero', 'WhatsApp', 'Público', 'Publico'
        ];

        // 1. Try explicit search with case-insensitivity
        const foundKey = Object.keys(l).find(k => phoneKeys.some(pk => pk.toLowerCase() === k.toLowerCase().trim()));
        if (foundKey && l[foundKey]) {
            const normalized = this.normalizePhoneNumber(String(l[foundKey]));
            if (normalized.length >= 8) return normalized;
        }

        // 2. Fallback to any key that contains "tel" or "phone" or "cel" or "zap"
        const looseKey = Object.keys(l).find(k => {
            const lowKey = k.toLowerCase();
            return lowKey.includes('tel') || lowKey.includes('phone') || lowKey.includes('cel') || lowKey.includes('zap') || lowKey.includes('num');
        });
        if (looseKey && l[looseKey]) {
            const normalized = this.normalizePhoneNumber(String(l[looseKey]));
            if (normalized.length >= 8) return normalized;
        }

        return '';
    }

    async create(tenantId: string, data: any) {
        try {
            // Sanitize data to only include valid entity fields
            const campaignData = {
                name: data.name,
                channels: data.channels,
                messageTemplate: data.messageTemplate,
                integrationId: data.integrationId,
                status: CampaignStatus.PAUSED, // Default to PAUSED
                tenantId,
                variations: data.variations
            };

            const campaign = this.campaignRepository.create(campaignData);
            const saved = await this.campaignRepository.save(campaign) as unknown as Campaign;
            const campaignId = saved.id;

            // Resolve instance name early for Contact association
            let instanceName = 'default';
            if (data.integrationId) {
                const resolved = await this.resolveInstanceName(data.integrationId, tenantId);
                if (resolved) instanceName = resolved;
            }

            // Handle Leads (Save to DB but DO NOT Queue yet)
            let leadsToProcess: CampaignLead[] = [];

            if (data.leads && Array.isArray(data.leads)) {
                const leadsData = data.leads;
                const chunkSize = 50;

                for (let i = 0; i < leadsData.length; i += chunkSize) {
                    const chunk = leadsData.slice(i, i + chunkSize);

                    // 1. Ensure Contacts exist
                    await Promise.all(chunk.map(l => {
                        const name = this.extractLeadName(l);
                        const phone = this.extractPhoneNumber(l);
                        if (!phone) return Promise.resolve(); // Skip missing phone

                        // Pass resolved instanceName to bind contact to instance
                        return this.crmService.ensureContact(tenantId, {
                            name: name,
                            phoneNumber: phone,
                            externalId: phone,
                            instance: instanceName
                        }, { forceStage: 'NOVO' });
                    }));

                    // 2. Create Campaign Leads
                    const leadsToCreate = chunk.map(l => {
                        const name = this.extractLeadName(l);
                        const phone = this.extractPhoneNumber(l);

                        if (!phone) {
                            this.logger.warn(`Lead sem telefone ignorado na importação: ${name}`);
                            return null;
                        }

                        return this.leadRepository.create({
                            name: name,
                            externalId: phone,
                            campaignId: campaignId,
                            status: LeadStatus.PENDING
                        });
                    }).filter(l => l !== null);

                    const savedLeads = await this.leadRepository.save(leadsToCreate);
                    leadsToProcess.push(...savedLeads);
                }
                this.logger.log(`Created ${leadsToProcess.length} leads for campaign ${campaignId}`);

            } else if (data.useExistingContacts) {
                const filters = data.filters || {};
                const contacts = await this.crmService.findAllByTenant(tenantId, filters);

                if (contacts.length > 0) {
                    // Filter contacts by instance if integrationId (instanceName) is provided
                    let filteredContacts = contacts;
                    if (data.integrationId) {
                        // The user might send UUID or direct instance name. 
                        // CrmService.findAllByTenant already handles 'instance' filter.
                        // However, here we might want to double check or re-fetch with instance filter.

                        // Let's re-fetch with instance to be 100% safe if integrationId is present
                        filteredContacts = await this.crmService.findAllByTenant(tenantId, {
                            ...filters,
                            instance: data.integrationId
                        });
                    }

                    const leadsToCreateEntities = filteredContacts.map(c => {
                        const phone = c.externalId || c.phoneNumber || '';
                        if (!phone) return null;

                        return this.leadRepository.create({
                            name: c.name || 'Contato',
                            externalId: phone,
                            campaignId: campaignId,
                            status: LeadStatus.PENDING
                        });
                    }).filter(l => l !== null);

                    const chunkSize = 500;
                    for (let i = 0; i < leadsToCreateEntities.length; i += chunkSize) {
                        const chunk = leadsToCreateEntities.slice(i, i + chunkSize);
                        const savedChunk = await this.leadRepository.save(chunk);
                        leadsToProcess.push(...savedChunk);
                    }
                    this.logger.log(`Created ${leadsToProcess.length} leads from contacts for campaign ${campaignId}`);
                }
            }

            if (leadsToProcess.length === 0) {
                throw new Error('Nenhum lead encontrado para esta campanha. Verifique o arquivo ou os filtros.');
            }

            // DO NOT QUEUE JOBS HERE. User must click "Start".

            return {
                id: saved.id,
                name: saved.name,
                status: saved.status,
                channels: saved.channels,
                messageTemplate: saved.messageTemplate,
                createdAt: saved.createdAt
            };
        } catch (error) {
            this.logger.error(`Error creating campaign: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findOne(id: string, tenantId: string) {
        return this.campaignRepository.findOne({
            where: { id, tenantId },
            relations: ['leads'],
        });
    }

    async updateStatus(id: string, tenantId: string, status: CampaignStatus) {
        if (status === CampaignStatus.RUNNING) {
            return this.start(id, tenantId);
        }

        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            campaign.status = status;
            return this.campaignRepository.save(campaign) as unknown as Campaign;
        }
        return null;
    }

    async update(id: string, tenantId: string, data: any) {
        // Simple update for basic fields
        return this.campaignRepository.update({ id, tenantId }, {
            name: data.name,
            channels: data.channels,
            integrationId: data.integrationId,
            messageTemplate: data.messageTemplate,
            variations: data.variations
        });
    }

    async remove(id: string, tenantId: string) {
        const campaign = await this.findOne(id, tenantId);
        if (campaign) {
            // Manually delete leads first to ensure no foreign key issues
            await this.leadRepository.delete({ campaignId: id });
            return this.campaignRepository.remove(campaign);
        }
    }

    async resetLeads(id: string, tenantId: string, statusToReset: LeadStatus[] = [LeadStatus.FAILED, LeadStatus.INVALID]) {
        const campaign = await this.findOne(id, tenantId);
        if (!campaign) throw new Error('Campanha não encontrada.');

        // Use QueryBuilder for robust IN clause with enums
        await this.leadRepository.createQueryBuilder()
            .update(CampaignLead)
            .set({ status: LeadStatus.PENDING, errorReason: null })
            .where("campaignId = :id", { id })
            .andWhere("status IN (:...statuses)", { statuses: statusToReset })
            .execute();

        this.logger.log(`[RESET] Leads da campanha ${id} resetados para PENDING (Status originais: ${statusToReset.join(', ')})`);
        return { success: true };
    }
    async getReportStats(tenantId: string, campaignId?: string) {
        const query = this.leadRepository.createQueryBuilder('lead')
            .select('lead.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .innerJoin('lead.campaign', 'campaign')
            .where('campaign.tenantId = :tenantId', { tenantId });

        if (campaignId && campaignId !== 'all') {
            query.andWhere('lead.campaignId = :campaignId', { campaignId });
        }

        const rawStats = await query.groupBy('lead.status').getRawMany();

        // Transform into friendly format
        const stats = {
            total: 0,
            pending: 0,
            sent: 0,
            failed: 0,
            invalid: 0
        };

        rawStats.forEach(s => {
            const count = parseInt(s.count, 10);
            stats.total += count;
            const status = s.status.toLowerCase();
            if (stats[status] !== undefined) {
                stats[status] += count;
            } else if (status === 'error' || status === 'unavailable') {
                stats.failed += count;
            }
        });

        // Calculate specific "Added" vs "Sent" vs "Not Sent"
        return {
            added: stats.total,
            sent: stats.sent,
            notSent: stats.total - stats.sent, // includes pending + failed
            details: stats
        };
    }
}
