import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Injectable()
export class MetricsService {
  private metrics: Map<string, number>;
  private timers: Map<string, number>;

  constructor(private logger: LoggerService) {
    this.metrics = new Map();
    this.timers = new Map();
  }

  increment(metric: string, value: number = 1): void {
    const currentValue = this.metrics.get(metric) || 0;
    this.metrics.set(metric, currentValue + value);
    this.logger.debug(`Metric ${metric} incremented by ${value}`, 'MetricsService');
  }

  decrement(metric: string, value: number = 1): void {
    const currentValue = this.metrics.get(metric) || 0;
    this.metrics.set(metric, Math.max(0, currentValue - value));
    this.logger.debug(`Metric ${metric} decremented by ${value}`, 'MetricsService');
  }

  set(metric: string, value: number): void {
    this.metrics.set(metric, value);
    this.logger.debug(`Metric ${metric} set to ${value}`, 'MetricsService');
  }

  get(metric: string): number {
    return this.metrics.get(metric) || 0;
  }

  startTimer(metric: string): void {
    this.timers.set(metric, Date.now());
  }

  endTimer(metric: string): number {
    const startTime = this.timers.get(metric);
    if (!startTime) {
      this.logger.warn(`Timer ${metric} not found`, 'MetricsService');
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(metric);
    this.logger.debug(`Timer ${metric} completed in ${duration}ms`, 'MetricsService');
    return duration;
  }

  getAllMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
    this.logger.debug('All metrics cleared', 'MetricsService');
  }
} 