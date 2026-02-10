import { Tenant } from '../../users/entities/tenant.entity';
export declare enum IntegrationProvider {
    FACEBOOK = "facebook",
    INSTAGRAM = "instagram",
    WHATSAPP = "whatsapp",
    TELEGRAM = "telegram",
    YOUTUBE = "youtube",
    TIKTOK = "tiktok",
    LINKEDIN = "linkedin",
    GOOGLE_DRIVE = "google_drive",
    GOOGLE_SHEETS = "google_sheets",
    MERCADO_LIVRE = "mercadolivre",
    OLX = "olx",
    N8N = "n8n",
    EVOLUTION = "evolution"
}
export declare enum IntegrationStatus {
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    EXPIRED = "expired",
    ERROR = "error"
}
export declare class Integration {
    id: string;
    provider: IntegrationProvider;
    status: IntegrationStatus;
    credentials: any;
    settings: any;
    aiEnabled: boolean;
    aiPromptId: string;
    aiModel: string;
    tenant: Tenant;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
