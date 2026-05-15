import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tickets')
export class Ticket {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ generated: "increment", type: "int" })
    ticketNumber: number;

    @Column()
    subject: string;

    @Column({ nullable: true })
    requesterName: string;

    @Column({ type: 'text' })
    description: string;

    @Column()
    category: string; // e.g., 'technical', 'billing', 'feature_request', 'other'

    @Column({ default: 'open' })
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled';

    @Column({ default: 'medium' })
    priority: 'low' | 'medium' | 'high' | 'urgent';

    @Column()
    tenantId: string;

    @Column()
    requesterId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'requesterId' })
    requester: User;

    @Column({ nullable: true })
    assigneeId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigneeId' })
    assignee: User;

    @Column({ nullable: true })
    teamId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
