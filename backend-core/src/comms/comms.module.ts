import { Module, Global } from '@nestjs/common';
import { CommsGateway } from './comms.gateway';
import { CommsService } from './comms.service';
import { JwtModule } from '@nestjs/jwt';

@Global() // Make it available everywhere without explicit importing in each module
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'zaplandia_super_secret_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [CommsGateway, CommsService],
  exports: [CommsService],
})
export class CommsModule {}
