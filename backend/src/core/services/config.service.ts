import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get(key: string, defaultValue?: any): any {
    return this.configService.get(key, defaultValue);
  }

  getString(key: string, defaultValue?: string): string {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      throw new Error(`Configuration key ${key} is not defined`);
    }
    return String(value);
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      throw new Error(`Configuration key ${key} is not defined`);
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Configuration key ${key} is not a valid number`);
    }
    return num;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      throw new Error(`Configuration key ${key} is not defined`);
    }
    return Boolean(value);
  }

  getArray<T>(key: string, defaultValue?: T[]): T[] {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      throw new Error(`Configuration key ${key} is not defined`);
    }
    if (!Array.isArray(value)) {
      throw new Error(`Configuration key ${key} is not an array`);
    }
    return value;
  }

  getObject<T>(key: string, defaultValue?: T): T {
    const value = this.get(key, defaultValue);
    if (value === undefined) {
      throw new Error(`Configuration key ${key} is not defined`);
    }
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Configuration key ${key} is not an object`);
    }
    return value as T;
  }
} 