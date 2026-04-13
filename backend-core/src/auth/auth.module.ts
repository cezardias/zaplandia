import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { UniversalAuthGuard } from './guards/universal-auth.guard';

import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        forwardRef(() => IntegrationsModule),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'zaplandia_super_secret_key',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtAuthGuard, ApiKeyGuard, UniversalAuthGuard],
    exports: [AuthService, JwtAuthGuard, ApiKeyGuard, UniversalAuthGuard],
})
export class AuthModule { }
