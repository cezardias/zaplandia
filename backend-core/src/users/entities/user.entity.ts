import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';

export enum UserRole {
    SUPERADMIN = 'superadmin',
    ADMIN = 'admin',
    USER = 'user',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // Hide password by default
    password: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @ManyToOne(() => Tenant, { nullable: true })
    tenant: Tenant;

    @Column({ nullable: true })
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;
}
