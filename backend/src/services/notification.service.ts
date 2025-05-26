import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../models/notification.model';
import { CreateNotificationDto, EmailNotificationDto, SmsNotificationDto, WebhookNotificationDto, UpdateNotificationDto, NotificationFilterDto, NotificationType, NotificationStatus } from '../dto/notification.dto';
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
    try {
      const notification = new this.notificationModel({
        ...createNotificationDto,
        status: NotificationStatus.PENDING,
      });
      const saved = await notification.save();
      this.metrics.increment('notifications.created');
      return saved;
    } catch (error) {
      this.logger.error('Error creating notification', error);
      throw error;
    }
  }

  async findAll(filter: NotificationFilterDto): Promise<Notification[]> {
    const query: any = {};
    if (filter.type) query.type = filter.type;
    if (filter.status) query.status = filter.status;
    if (filter.recipient) query.recipient = filter.recipient;
    return this.notificationModel.find(query).exec();
  }

  async findOne(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel.findById(id).exec();
      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }
      return notification;
    } catch (error) {
      this.logger.error(`Error finding notification ${id}`, error);
      throw error;
    }
  }

  async update(id: string, updateNotificationDto: Partial<CreateNotificationDto>): Promise<Notification> {
    try {
      const notification = await this.notificationModel
        .findByIdAndUpdate(id, updateNotificationDto, { new: true })
        .exec();
      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }
      this.metrics.increment('notifications.updated');
      return notification;
    } catch (error) {
      this.logger.error(`Error updating notification ${id}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.notificationModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }
      this.metrics.increment('notifications.deleted');
    } catch (error) {
      this.logger.error(`Error deleting notification ${id}`, error);
      throw error;
    }
  }

  async findFailed(): Promise<Notification[]> {
    try {
      return await this.notificationModel.find({ status: NotificationStatus.FAILED }).exec();
    } catch (error) {
      this.logger.error('Error finding failed notifications', error);
      throw error;
    }
  }

  async retryFailed(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel.findById(id).exec();
      if (!notification) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }

      if (notification.status !== NotificationStatus.FAILED) {
        throw new Error('Only failed notifications can be retried');
      }

      notification.status = NotificationStatus.PENDING;
      notification.retryCount = (notification.retryCount || 0) + 1;

      const saved = await notification.save();
      this.metrics.increment('notifications.retried');
      return saved;
    } catch (error) {
      this.logger.error(`Error retrying notification ${id}`, error);
      throw error;
    }
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      switch (notification.type) {
        case NotificationType.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationType.SMS:
          await this.sendSMS(notification);
          break;
        case NotificationType.WEBHOOK:
          await this.sendWebhook(notification);
          break;
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notification.save();
      this.metrics.increment('notifications.sent');
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = error.message;
      await notification.save();
      this.metrics.increment('notifications.failed');
      throw error;
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    try {
      await this.emailTransporter.sendMail({
        to: notification.recipient,
        subject: notification.subject,
        text: notification.content,
      });
      this.metrics.increment('notifications.email.sent');
    } catch (error) {
      this.metrics.increment('notifications.email.failed');
      throw error;
    }
  }

  private async sendSMS(notification: Notification): Promise<void> {
    try {
      await this.twilioClient.messages.create({
        to: notification.recipient,
        from: this.configService.get('sms.from'),
        body: notification.content,
      });
      this.metrics.increment('notifications.sms.sent');
    } catch (error) {
      this.metrics.increment('notifications.sms.failed');
      throw error;
    }
  }

  private async sendWebhook(notification: Notification): Promise<void> {
    try {
      await axios.post(notification.recipient, {
        subject: notification.subject,
        content: notification.content,
        metadata: notification.metadata,
      });
      this.metrics.increment('notifications.webhook.sent');
    } catch (error) {
      this.metrics.increment('notifications.webhook.failed');
      throw error;
    }
  }
} 