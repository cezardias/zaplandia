import { Tenant } from '../../users/entities/tenant.entity';
export declare class Contact {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    externalId: string;
    provider: string;
    lastMessage: string;
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
    provider: string;
    rawPayload: any;
    contact: Contact;
    contactId: string;
    tenant: Tenant;
    tenantId: string;
    createdAt: Date;
}
