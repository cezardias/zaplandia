import { Tenant } from '../../users/entities/tenant.entity';
export declare class Contact {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    externalId: string;
    provider: string;
    lastMessage: string;
    instance: string;
    aiEnabled: boolean | null;
    stage: string;
    tags: string[];
    location: string;
    value: number;
    metadata: any;
    tenant: Tenant;
    tenantId: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class Message {
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    wamid: string;
    status: string;
    provider: string;
    rawPayload: any;
    mediaUrl: string;
    mediaType: string;
    mediaMimeType: string;
    mediaFileName: string;
    contact: Contact;
    contactId: string;
    tenant: Tenant;
    tenantId: string;
    instance: string;
    createdAt: Date;
}
