import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { CrmModule } from './crm/crm.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { SupportModule } from './support/support.module';
import { DebugModule } from './debug/debug.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    IntegrationsModule,
    CrmModule,
    WebhooksModule,
    DashboardModule,
    CampaignsModule,
    SupportModule,
    DebugModule,
    AiModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
      username: (process.env.DB_USER || 'zaplandia') as string,
      password: (process.env.DB_PASS || 'zaplandia_secret') as string,
      database: (process.env.DB_NAME || 'zaplandia_db') as string,
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
