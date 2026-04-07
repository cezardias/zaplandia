import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineStage } from './entities/pipeline-stage.entity';

@Injectable()
export class PipelineStageService {
    private readonly logger = new Logger(PipelineStageService.name);

    constructor(
        @InjectRepository(PipelineStage)
        private readonly stageRepository: Repository<PipelineStage>,
    ) { }

    async findAll(tenantId: string) {
        let stages = await this.stageRepository.find({
            where: { tenantId },
            order: { order: 'ASC' }
        });

        if (stages.length === 0) {
            stages = await this.seedDefaultStages(tenantId);
        }

        return stages;
    }

    async create(tenantId: string, data: { name: string, order?: number, color?: string }) {
        const key = data.name.toUpperCase().replace(/\s+/g, '_');
        const stage = this.stageRepository.create({
            ...data,
            key,
            tenantId,
            order: data.order ?? 0
        });
        return this.stageRepository.save(stage);
    }

    async update(id: string, tenantId: string, data: Partial<PipelineStage>) {
        await this.stageRepository.update({ id, tenantId }, data);
        return this.stageRepository.findOne({ where: { id, tenantId } });
    }

    async delete(id: string, tenantId: string) {
        return this.stageRepository.delete({ id, tenantId });
    }

    private async seedDefaultStages(tenantId: string) {
        const defaults = [
            { name: 'Novos Leads', key: 'NOVO', order: 1 },
            { name: 'Contatados', key: 'CONTACTED', order: 2 },
            { name: 'Em Negociação', key: 'NEGOTIATION', order: 3 },
            { name: 'Interessados', key: 'INTERESTED', order: 4 },
            { name: 'Convertido', key: 'CONVERTIDO', order: 5 },
            { name: 'Não Interessado', key: 'NOT_INTERESTED', order: 6 },
        ];

        const stages = defaults.map(d => this.stageRepository.create({ ...d, tenantId }));
        return this.stageRepository.save(stages);
    }
}
