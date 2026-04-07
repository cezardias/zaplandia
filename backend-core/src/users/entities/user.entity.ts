import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Team } from '../../teams/entities/team.entity';

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

    @ManyToOne(() => Team, (team) => team.members, { nullable: true })
    team: Team | null;

    @Column({ nullable: true })
    teamId: string | null;

    @Column({ nullable: true })
    tenantId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
