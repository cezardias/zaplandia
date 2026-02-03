import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../users/entities/tenant.entity';

@Entity('contacts')
export class Contact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    externalId: string; // ID from FB, WhatsApp, etc.

    @Column({ nullable: true })
    provider: string;

    @Column({ nullable: true })
    lastMessage: string;

    @Column({ default: 'LEAD' })
    stage: string; // NOVO, CONTACTED, NEGOTIATION, INTERESTED, CONVERTIDO, NOT_INTERESTED

    @Column('simple-array', { nullable: true })
    tags: string[];

    @Column({ nullable: true })
    location: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    value: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any; // Stores avatar, social profile links, etc.

    @ManyToOne(() => Tenant)
    tenant: Tenant;

    @Column()
    tenantId: string;

    @OneToMany(() => Message, (message) => message.contact)
    messages: Message[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column()
    direction: 'inbound' | 'outbound';

    @Column({ nullable: true })
    wamid: string; // WhatsApp Message ID (external)

    @Column({ nullable: true, default: 'PENDING' })
    status: string; // PENDING, SENT, DELIVERED, READ, PLAYED

    @Column({ nullable: true })
    provider: string; // which network it came from

    @Column({ type: 'jsonb', nullable: true })
    rawPayload: any; // Original API response

    @Column({ nullable: true })
    mediaUrl: string;

    @Column({ nullable: true })
    mediaType: string; // image, video, document, audio

    @Column({ nullable: true })
    mediaMimeType: string;

    @Column({ nullable: true })
    mediaFileName: string;

    @ManyToOne(() => Contact, (contact) => contact.messages)
    contact: Contact;

    @Column()
    contactId: string;

    @ManyToOne(() => Tenant)
    tenant: Tenant;

    @Column()
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;
}
