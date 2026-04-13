import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    slug: string; // Used for subdomains or identifying the tenant

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'timestamp', nullable: true })
    trialEndsAt: Date;

    @Column({ 
        type: 'varchar', 
        default: 'trial' 
    })
    planType: string; // trial, monthly, annual

    @Column({ 
        type: 'varchar', 
        default: 'trial' 
    })
    subscriptionStatus: string; // trial, active, expired, pending

    @Column({ type: 'timestamp', nullable: true })
    paidUntil: Date;

    @CreateDateColumn()
    createdAt: Date;
}
