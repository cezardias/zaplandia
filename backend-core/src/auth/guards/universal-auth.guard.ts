import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class UniversalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Try API Key first (cheaper/direct for external tools)
    const canByApiKey = await this.apiKeyGuard.canActivate(context).catch(() => false);
    if (canByApiKey) return true;

    // 2. Fallback to JWT (standard for frontend/mobile)
    const canByJwt = await this.jwtGuard.canActivate(context).catch(() => false);
    return canByJwt;
  }
}
