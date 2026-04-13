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
    try {
      const result = this.apiKeyGuard.canActivate(context);
      const canByApiKey = result instanceof Promise ? await result : result;
      if (canByApiKey) return true;
    } catch (e) {
      // Ignore API key errors and fall back to JWT
    }

    // 2. Fallback to JWT (standard for frontend/mobile)
    try {
      const result = this.jwtGuard.canActivate(context);
      const canByJwt = result instanceof Promise ? await result : result;
      return !!canByJwt;
    } catch (e) {
      return false;
    }
  }
}
