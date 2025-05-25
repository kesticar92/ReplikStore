import { Module } from '@nestjs/common';
import { LoggerService } from '../core/services/logger.service';

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {} 