import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('daily_usage')
@Index(['tenantId', 'instanceName', 'day', 'feature'], { unique: true }) // Scoped by Instance
export class DailyUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenantId: string;

    @Column({ nullable: true }) // Nullable for backward compatibility or global limits
    instanceName: string;

    @Column({ type: 'date' })
    day: string; // YYYY-MM-DD

    @Column()
    feature: string; // e.g., 'whatsapp_messages'

    @Column({ default: 0 })
    count: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
