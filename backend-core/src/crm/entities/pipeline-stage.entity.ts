import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../users/entities/tenant.entity';

@Entity('pipeline_stages')
export class PipelineStage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    key: string;

    @Column({ default: 0 })
    order: number;

    @Column({ nullable: true })
    color: string;

    @Column({ type: 'text', nullable: true })
    qualificationCriteria: string;

    @ManyToOne(() => Tenant)
    tenant: Tenant;

    @Column()
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
