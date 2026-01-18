import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'zaplandia',
      password: process.env.DB_PASS || 'zaplandia_secret',
      database: process.env.DB_NAME || 'zaplandia_db',
      autoLoadEntities: true,
      synchronize: true, // Only for development/initial setup
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
