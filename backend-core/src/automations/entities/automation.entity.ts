import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('automations')
export class Automation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    tenantId: string;

    @Column({ nullable: true })
    n8nWorkflowId: string;

    @Column({ type: 'jsonb', nullable: true })
    workflowData: any;

    @Column({ default: 'draft' })
    status: 'active' | 'paused' | 'draft';

    @Column({ nullable: true })
    createdBy: string;
    
    @Column({ default: 0 })
    nodesCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
