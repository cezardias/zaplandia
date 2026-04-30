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
    // TEMPORARY: Relaxed check to debug persistence issues
    console.log(`[THEME_SYNC] User ${req.user?.email} attempting to change theme to ${body.theme}`);
    
    // Check if it's Cezar or if we are in debug mode
    if (req.user?.email !== 'cezar.dias@gmail.com' && req.user?.role !== 'superadmin') {
      throw new ForbiddenException('Apenas administradores podem alterar o tema global.');
    }

    // Persist global theme using the correct service method
    await this.integrationsService.saveApiCredential(null, 'GLOBAL_THEME', body.theme);

    return { success: true, theme: body.theme };
  }
}
