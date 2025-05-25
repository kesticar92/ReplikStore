import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationType = 'email' | 'sms' | 'webhook';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true })
  type: NotificationType;

  @Prop({ required: true })
  recipient: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: 'pending' })
  status: NotificationStatus;

  @Prop()
  error?: string;

  @Prop()
  sentAt?: Date;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: 3 })
  maxRetries: number;

  canRetry(): boolean {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
  }

  markAsSent(): void {
    this.status = 'sent';
    this.sentAt = new Date();
  }

  markAsFailed(error: string): void {
    this.status = 'failed';
    this.error = error;
    this.retryCount += 1;
  }
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Índices
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ createdAt: 1 }); 