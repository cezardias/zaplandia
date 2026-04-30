import { Controller, Get, Post, Body, UseGuards, ForbiddenException, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppService } from './app.service';
import { IntegrationsService } from './integrations/integrations.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly integrationsService: IntegrationsService
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('config')
  async getGlobalConfig() {
    const theme = await this.integrationsService.getCredential(null, 'GLOBAL_THEME', true);
    return {
      theme: theme || 'dark'
    };
  }

  @Post('config')
  @UseGuards(JwtAuthGuard)
  async saveGlobalConfig(@Request() req, @Body() body: { theme: string }) {
    // Only Cezar can change the global theme
    if (req.user.email !== 'cezar.dias@gmail.com') {
      throw new ForbiddenException('Apenas o Superadmin pode alterar o tema global.');
    }

    await this.integrationsService.saveCredential(null, {
      name: 'GLOBAL_THEME',
      value: body.theme,
      isPublic: true
    });

    return { success: true, theme: body.theme };
  }
}
