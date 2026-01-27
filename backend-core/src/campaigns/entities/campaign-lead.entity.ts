import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Campaign } from './campaign.entity';

export enum LeadStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
}

@Entity('campaign_leads')
export class CampaignLead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    externalId: string; // Phone number or account ID

    @Column({
        type: 'enum',
        enum: LeadStatus,
        default: LeadStatus.PENDING,
    })
    status: LeadStatus;

    @Column({ type: 'text', nullable: true })
    errorReason: string;

    @ManyToOne(() => Campaign, (campaign) => campaign.leads)
    campaign: Campaign;

    @Column()
    campaignId: string;

    @CreateDateColumn()
    createdAt: Date;
}
