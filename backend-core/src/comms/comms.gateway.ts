import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
  namespace: '/',
})
export class CommsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const tenantId = payload.tenantId;

      if (!tenantId) {
        this.logger.warn(`Token without tenantId: ${client.id}`);
        client.disconnect();
        return;
      }

      // Join tenant-specific room
      const room = `tenant_${tenantId}`;
      client.join(room);
      
      this.logger.log(`Client connected: ${client.id} | Tenant: ${tenantId} | Joined: ${room}`);
      
      client.emit('authenticated', { status: 'ok', room });
    } catch (error) {
      this.logger.error(`Handshake failed for ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // --- Utility Emitters ---

  emitToTenant(tenantId: string, event: string, data: any) {
    const room = `tenant_${tenantId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`[WS_EMIT] Room: ${room} | Event: ${event}`);
  }
}

