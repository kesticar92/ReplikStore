import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ReportType, ReportFormat, ReportStatus } from '../dto/report.dto';

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true, enum: ReportType })
  type: ReportType;

  @Prop({ required: true, enum: ReportFormat })
  format: ReportFormat;

  @Prop({ required: true, enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Prop({ type: Object })
  parameters?: Record<string, any>;

  @Prop()
  filePath?: string;

  @Prop()
  errorMessage?: string;

  @Prop({ default: false })
  isScheduled: boolean;

  @Prop()
  scheduledDate?: Date;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

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

  @Prop({ type: Object })
  schedule?: any;

  markAsProcessing(): void {
    this.status = ReportStatus.PROCESSING;
  }

  markAsCompleted(fileUrl: string, fileSize: number): void {
    this.status = ReportStatus.COMPLETED;
    this.fileUrl = fileUrl;
    this.fileSize = fileSize;
    this.generatedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = ReportStatus.FAILED;
    this.errorMessage = errorMessage;
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