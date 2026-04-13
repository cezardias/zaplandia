import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IntegrationsService } from '../../integrations/integrations.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly integrationsService: IntegrationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      return false; // Let JwtAuthGuard handle it if this also has JwtAuthGuard, or fail if it's only ApiKeyGuard
    }

    const credential = await this.integrationsService.findCredentialByValue('TENANT_API_KEY', apiKey);
    
    if (!credential || !credential.tenantId) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Inject a partial user object so controllers can still use req.user.tenantId
    request.user = {
      tenantId: credential.tenantId,
      role: 'api', // Special role for API Key access
      userId: 'api-system'
    };

    return true;
  }
}
