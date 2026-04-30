import { Injectable, Logger } from '@nestjs/common';
import { CommsGateway } from './comms.gateway';

@Injectable()
export class CommsService {
    private readonly logger = new Logger(CommsService.name);

    constructor(private readonly gateway: CommsGateway) {}

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

