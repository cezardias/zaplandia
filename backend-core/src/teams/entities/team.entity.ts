import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Tenant } from '../../users/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

@Entity('teams')
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @ManyToOne(() => Tenant)
    tenant: Tenant;

    @Column()
    tenantId: string;

    @OneToMany(() => User, (user) => user.team)
    members: User[];

    @CreateDateColumn()
    createdAt: Date;
}
