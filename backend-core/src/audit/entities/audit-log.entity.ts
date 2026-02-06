import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    tenantId: string;

    @Column({ nullable: true })
    userId: string;

    @Column()
    action: string; // e.g., 'CAMPAIGN_START'

    @Column('text', { nullable: true })
    details: string; // JSON string

    @Column({ nullable: true })
    ip: string;

    @CreateDateColumn()
    createdAt: Date;
}
