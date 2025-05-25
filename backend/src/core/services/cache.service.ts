import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoggerService } from './logger.service';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly prefix: string = 'cache:';

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.client = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis error:', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.prefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error('Error getting from cache:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.client.setex(this.prefix + key, ttl, stringValue);
    } catch (error) {
      this.logger.error('Error setting cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.prefix + key);
    } catch (error) {
      this.logger.error('Error deleting from cache:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(this.prefix + key)) === 1;
    } catch (error) {
      this.logger.error('Error checking cache existence:', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
} 