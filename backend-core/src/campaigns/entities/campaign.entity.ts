import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../users/entities/tenant.entity';
import { CampaignLead } from './campaign-lead.entity';

export enum CampaignStatus {
    PENDING = 'pending',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('campaigns')
export class Campaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: CampaignStatus,
        default: CampaignStatus.PENDING,
    })
    status: CampaignStatus;

    @Column({ type: 'jsonb', nullable: true })
    channels: string[]; // ['whatsapp', 'instagram', ...]

    @Column({ type: 'text', nullable: true })
    messageTemplate: string;

    @ManyToOne(() => Tenant)
    tenant: Tenant;

    @Column()
    tenantId: string;

    @OneToMany(() => CampaignLead, (lead) => lead.campaign)
    leads: CampaignLead[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
