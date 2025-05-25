import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportType = 'inventory' | 'sales' | 'performance' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true })
  type: ReportType;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Object, required: true })
  parameters: Record<string, any>;

  @Prop({ required: true })
  format: ReportFormat;

  @Prop({ default: 'pending' })
  status: ReportStatus;

  @Prop()
  error?: string;

  @Prop()
  fileUrl?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  generatedAt?: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: false })
  isScheduled: boolean;

  @Prop()
  schedule?: {
    frequency: string;
    lastRun?: Date;
    nextRun?: Date;
  };

  markAsProcessing(): void {
    this.status = 'processing';
  }

  markAsCompleted(fileUrl: string, fileSize: number): void {
    this.status = 'completed';
    this.fileUrl = fileUrl;
    this.fileSize = fileSize;
    this.generatedAt = new Date();
  }

  markAsFailed(error: string): void {
    this.status = 'failed';
    this.error = error;
  }

  updateSchedule(nextRun: Date): void {
    if (this.schedule) {
      this.schedule.lastRun = new Date();
      this.schedule.nextRun = nextRun;
    }
  }
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Índices
ReportSchema.index({ type: 1, status: 1 });
ReportSchema.index({ createdAt: 1 });
ReportSchema.index({ 'schedule.nextRun': 1 }); 