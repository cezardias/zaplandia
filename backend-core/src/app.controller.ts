import { Controller, Get } from '@nestjs/common';
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
}
