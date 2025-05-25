import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../models/notification.model';
import { CreateNotificationDto, EmailNotificationDto, SmsNotificationDto, WebhookNotificationDto } from '../dto/notification.dto';
import { LoggerService } from '../core/services/logger.service';
import { MetricsService } from '../core/services/metrics.service';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly emailTransporter: nodemailer.Transporter;
  private readonly twilioClient: twilio.Twilio;

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {
    // Configurar el transportador de correo
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get('email.host'),
      port: this.configService.get('email.port'),
      secure: this.configService.get('email.secure'),
      auth: {
        user: this.configService.get('email.auth.user'),
        pass: this.configService.get('email.auth.pass'),
      },
    });

    // Configurar el cliente de Twilio
    this.twilioClient = twilio(
      this.configService.get('sms.accountSid'),
      this.configService.get('sms.authToken'),
    );
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel(createNotificationDto);
    await notification.save();

    try {
      switch (notification.type) {
        case 'email':
          await this.sendEmail(notification as EmailNotificationDto);
          break;
        case 'sms':
          await this.sendSMS(notification as SmsNotificationDto);
          break;
        case 'webhook':
          await this.sendWebhook(notification as WebhookNotificationDto);
          break;
      }

      notification.markAsSent();
      this.metrics.incrementCounter('notification_operations_total', {
        type: notification.type,
        status: 'success',
      });
    } catch (error) {
      notification.markAsFailed(error.message);
      this.metrics.incrementCounter('notification_operations_total', {
        type: notification.type,
        status: 'error',
      });
      this.logger.error(`Error sending notification: ${error.message}`, error);
    }

    await notification.save();
    return notification;
  }

  private async sendEmail(notification: EmailNotificationDto): Promise<void> {
    const start = Date.now();
    try {
      await this.emailTransporter.sendMail({
        to: notification.recipient,
        subject: notification.subject,
        text: notification.content,
      });

      this.metrics.observeHistogram('notification_operation_duration_seconds',
        (Date.now() - start) / 1000,
        { type: 'email' }
      );
    } catch (error) {
      throw new Error(`Error sending email: ${error.message}`);
    }
  }

  private async sendSMS(notification: SmsNotificationDto): Promise<void> {
    const start = Date.now();
    try {
      await this.twilioClient.messages.create({
        body: notification.content,
        to: notification.recipient,
        from: this.configService.get('sms.from'),
      });

      this.metrics.observeHistogram('notification_operation_duration_seconds',
        (Date.now() - start) / 1000,
        { type: 'sms' }
      );
    } catch (error) {
      throw new Error(`Error sending SMS: ${error.message}`);
    }
  }

  private async sendWebhook(notification: WebhookNotificationDto): Promise<void> {
    const start = Date.now();
    try {
      await axios.post(notification.recipient, {
        subject: notification.subject,
        content: notification.content,
        metadata: notification.metadata,
      });

      this.metrics.observeHistogram('notification_operation_duration_seconds',
        (Date.now() - start) / 1000,
        { type: 'webhook' }
      );
    } catch (error) {
      throw new Error(`Error sending webhook: ${error.message}`);
    }
  }

  async findPending(): Promise<Notification[]> {
    return this.notificationModel.find({ status: 'pending' }).exec();
  }

  async findFailed(): Promise<Notification[]> {
    return this.notificationModel.find({
      status: 'failed',
      retryCount: { $lt: '$maxRetries' },
    }).exec();
  }

  async retryFailed(notification: Notification): Promise<void> {
    if (!notification.canRetry()) {
      throw new Error('Notification cannot be retried');
    }

    try {
      switch (notification.type) {
        case 'email':
          await this.sendEmail(notification as EmailNotificationDto);
          break;
        case 'sms':
          await this.sendSMS(notification as SmsNotificationDto);
          break;
        case 'webhook':
          await this.sendWebhook(notification as WebhookNotificationDto);
          break;
      }

      notification.markAsSent();
      this.metrics.incrementCounter('notification_retry_total', {
        type: notification.type,
        status: 'success',
      });
    } catch (error) {
      notification.markAsFailed(error.message);
      this.metrics.incrementCounter('notification_retry_total', {
        type: notification.type,
        status: 'error',
      });
      this.logger.error(`Error retrying notification: ${error.message}`, error);
    }

    await notification.save();
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }
    return notification;
  }
} 