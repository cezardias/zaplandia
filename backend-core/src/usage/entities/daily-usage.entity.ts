import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('daily_usage')
@Index(['tenantId', 'day', 'feature'], { unique: true })
export class DailyUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenantId: string;

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
