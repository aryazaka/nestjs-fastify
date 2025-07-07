import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppLogger } from './logger.service';

@Module({
  imports: [LoggerModule],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class AppLoggerModule {}
