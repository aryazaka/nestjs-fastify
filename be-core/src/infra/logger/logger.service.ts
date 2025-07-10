import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppLogger {
  constructor(private readonly logger: PinoLogger) {}

  info(message: string, ...args: any[]) {
    this.logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(message, ...args);
  }

  error(message: string, trace?: string) {
    this.logger.error({ msg: message, trace });
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug(message, ...args);
  }
}
