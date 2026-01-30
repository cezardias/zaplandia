import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

    // Tenant ID stored as string without foreign key constraint
    // This allows saving credentials even if tenant doesn't exist in DB yet
    @Column({ nullable: true })
    tenantId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
