import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../users/entities/tenant.entity';

export enum IntegrationProvider {
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    WHATSAPP = 'whatsapp',
    TELEGRAM = 'telegram',
    YOUTUBE = 'youtube',
    TIKTOK = 'tiktok',
    LINKEDIN = 'linkedin',
    GOOGLE_DRIVE = 'google_drive',
    GOOGLE_SHEETS = 'google_sheets',
    MERCADO_LIVRE = 'mercadolivre',
    OLX = 'olx',
    N8N = 'n8n',
    EVOLUTION = 'evolution',
}

export enum IntegrationStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    EXPIRED = 'expired',
    ERROR = 'error',
}

@Entity('integrations')
export class Integration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: IntegrationProvider,
    })
    provider: IntegrationProvider;

    @Column({
        type: 'enum',
        enum: IntegrationStatus,
        default: IntegrationStatus.DISCONNECTED,
    })
    status: IntegrationStatus;

    @Column({ type: 'jsonb', nullable: true })
    credentials: any; // encrypted access tokens, refresh tokens, etc.

    @Column({ type: 'jsonb', nullable: true })
    settings: any; // specific config for this network (e.g. which phone number for WhatsApp)

    // AI Agent Configuration
    @Column({ default: false })
    aiEnabled: boolean; // Enable AI auto-responses for this instance

    @Column({ nullable: true })
    aiPromptId: string; // ID of the AI prompt to use

    @ManyToOne(() => Tenant)
    tenant: Tenant;

    @Column()
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
