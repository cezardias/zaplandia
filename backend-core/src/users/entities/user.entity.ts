import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

export enum UserRole {
    SUPERADMIN = 'superadmin',
    ADMIN = 'admin',
    USER = 'user',
    AGENT = 'agent',
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
    tenantId: string | null;

    @ManyToOne('Team', 'members', { nullable: true })
    @JoinColumn({ name: 'teamId' })
    team: any; 

    @Column({ nullable: true })
    teamId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
