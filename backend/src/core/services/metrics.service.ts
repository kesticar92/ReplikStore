import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { Counter, Histogram, Registry } from 'prom-client';
import { ConfigService } from './config.service';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly counters: Map<string, Counter<string>>;
  private readonly histograms: Map<string, Histogram<string>>;

  constructor(private readonly logger: LoggerService, private configService: ConfigService) {
    this.registry = new Registry();
    this.counters = new Map();
    this.histograms = new Map();
  }

  onModuleInit() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Métricas de sistema
    this.createCounter({
      name: 'system_requests_total',
      help: 'Total de peticiones al sistema',
      labelNames: ['method', 'path', 'status'],
    });

    this.createHistogram({
      name: 'system_request_duration_seconds',
      help: 'Duración de las peticiones en segundos',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // Métricas de negocio
    this.createCounter({
      name: 'inventory_operations_total',
      help: 'Total de operaciones de inventario',
      labelNames: ['operation', 'status'],
    });

    this.createHistogram({
      name: 'inventory_operation_duration_seconds',
      help: 'Duración de operaciones de inventario en segundos',
      labelNames: ['operation'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
  }

  createCounter(options: { name: string; help: string; labelNames?: string[] }) {
    const counter = new Counter({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames,
      registers: [this.registry],
    });
    this.counters.set(options.name, counter);
    return counter;
  }

  createHistogram(options: {
    name: string;
    help: string;
    labelNames?: string[];
    buckets?: number[];
  }) {
    const histogram = new Histogram({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames,
      buckets: options.buckets,
      registers: [this.registry],
    });
    this.histograms.set(options.name, histogram);
    return histogram;
  }

  incrementCounter(name: string, labels?: Record<string, string | number>) {
    const counter = this.counters.get(name);
    if (counter) {
      counter.inc(labels || {});
    } else {
      this.logger.warn(`Counter ${name} not found`);
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string | number>) {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.observe(labels || {}, value);
    } else {
      this.logger.warn(`Histogram ${name} not found`);
    }
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  increment(name: string, labels: Record<string, string> = {}): void {
    const counter = this.getOrCreateCounter(name);
    counter.inc(labels);
  }

  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const histogram = this.getOrCreateHistogram(name);
    histogram.observe(labels, value);
  }

  private getOrCreateCounter(name: string): Counter<string> {
    if (!this.counters.has(name)) {
      this.counters.set(
        name,
        new Counter({
          name: `${this.configService.get('METRICS_PREFIX')}_${name}`,
          help: `Counter for ${name}`,
          labelNames: Object.keys(this.configService.get('METRICS_DEFAULT_LABELS', {})),
        }),
      );
    }
    return this.counters.get(name)!;
  }

  private getOrCreateHistogram(name: string): Histogram<string> {
    if (!this.histograms.has(name)) {
      this.histograms.set(
        name,
        new Histogram({
          name: `${this.configService.get('METRICS_PREFIX')}_${name}`,
          help: `Histogram for ${name}`,
          labelNames: Object.keys(this.configService.get('METRICS_DEFAULT_LABELS', {})),
          buckets: this.configService.get('METRICS_HISTOGRAM_BUCKETS', [0.1, 0.5, 1, 2, 5]),
        }),
      );
    }
    return this.histograms.get(name)!;
  }
} 