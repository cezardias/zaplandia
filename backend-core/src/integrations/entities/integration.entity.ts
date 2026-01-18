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

    @ManyToOne(() => Tenant)
    tenant: Tenant;

    @Column()
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
