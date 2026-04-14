import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../users/entities/tenant.entity';

export enum PaymentMethod {
    PIX = 'pix',
    BOLETO = 'boleto',
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    EXPIRED = 'expired',
    FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    tenantId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
    })
    method: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({ nullable: true })
    installments: number;

    @Column({ nullable: true })
    btgPaymentId: string; // ID from BTG

    @Column({ nullable: true })
    checkoutUrl: string;

    @Column({ nullable: true })
    pixQrCode: string;

    @Column({ nullable: true })
    pixCopyPaste: string;

    @CreateDateColumn()
    createdAt: Date;
}
