import { Injectable, Logger } from '@nestjs/common';
import { CommunicationGateway } from './communication.gateway';

@Injectable()
export class CommunicationService {
    private readonly logger = new Logger(CommunicationService.name);

    constructor(private readonly gateway: CommunicationGateway) {}

    /**
     * Sends a real-time event to all connected users of a specific tenant.
     * @param tenantId The UUID of the tenant
     * @param event Event name (e.g., 'new_message')
     * @param data Payload to send
     */
    emitToTenant(tenantId: string, event: string, data: any) {
        try {
            this.gateway.emitToTenant(tenantId, event, data);
        } catch (error) {
            this.logger.error(`Failed to emit real-time event: ${error.message}`);
        }
    }

    /**
     * Broadcast to everyone (rarely used for multi-tenant apps)
     */
    broadcast(event: string, data: any) {
        this.gateway.server.emit(event, data);
    }
}
