import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('billing_configs')
export class BillingConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    btgClientId: string;

    @Column({ nullable: true, select: false }) // Select: false for security
    btgClientSecret: string;
    
    @Column({ nullable: true })
    btgPixKey: string;

    @Column({ default: false })
    isSandbox: boolean;

    @Column({ nullable: true, select: false })
    btgWebhookSecret: string;

    @Column({ default: 'cal.zaplandia.com.br' })
    smtpHost: string;

    @Column({ default: 587 })
    smtpPort: number;

    @Column({ default: 'financeiro@zaplandia.com.br' })
    smtpUser: string;

    @Column({ nullable: true, select: false })
    smtpPass: string;

    @UpdateDateColumn()
    updatedAt: Date;
}
