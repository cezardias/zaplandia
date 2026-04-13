import { Module, Global } from '@nestjs/common';
import { CommunicationGateway } from './communication.gateway';
import { CommunicationService } from './communication.service';
import { JwtModule } from '@nestjs/jwt';

@Global() // Make it available everywhere without explicit importing in each module
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'zaplandia_super_secret_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [CommunicationGateway, CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
