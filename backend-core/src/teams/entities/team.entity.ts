import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('teams')
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    tenantId: string;

    @OneToMany(() => User, (user) => user.team)
    members: User[];

    @CreateDateColumn()
    createdAt: Date;
}
