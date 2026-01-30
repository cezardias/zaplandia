import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Tenant } from '../../users/entities/tenant.entity';

@Entity('api_credentials')
export class ApiCredential {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    key_name: string; // e.g. 'FACEBOOK_CLIENT_ID'

    @Column()
    key_value: string; // The secret/id itself

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => Tenant, { nullable: true })
    tenant: Tenant; // If null, it's a GLOBAL key set by SUPERADMIN

    @Column({ nullable: true })
    tenantId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
