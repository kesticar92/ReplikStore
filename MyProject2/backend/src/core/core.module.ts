import { Global, Module } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { CacheService } from './services/cache.service';
import { AuthService } from './services/auth.service';
import { MetricsService } from './services/metrics.service';

@Global()
@Module({
  providers: [
    LoggerService,
    CacheService,
    AuthService,
    MetricsService,
  ],
  exports: [
    LoggerService,
    CacheService,
    AuthService,
    MetricsService,
  ],
})
export class CoreModule {} 