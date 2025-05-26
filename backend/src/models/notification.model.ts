import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationType, NotificationStatus } from '../dto/notification.dto';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  recipient: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  error?: string;

  @Prop()
  sentAt?: Date;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: 3 })
  maxRetries: number;

  canRetry(): boolean {
    return this.status === NotificationStatus.FAILED && this.retryCount < this.maxRetries;
  }

  markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
  }

  markAsFailed(error: string): void {
    this.status = NotificationStatus.FAILED;
    this.error = error;
    this.retryCount += 1;
  }
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Índices
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ createdAt: 1 }); 