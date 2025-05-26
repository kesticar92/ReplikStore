import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

@Injectable()
export class CacheService {
  private cache: Map<string, { value: any; expiry: number }>;
  private readonly defaultTTL: number;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.cache = new Map();
    this.defaultTTL = 3600; // 1 hora por defecto
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiry });
    this.logger.debug(`Cache set for key: ${key}`, 'CacheService');
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`Cache deleted for key: ${key}`, 'CacheService');
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Cache cleared', 'CacheService');
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
} 