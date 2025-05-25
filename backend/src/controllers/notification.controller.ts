import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto, EmailNotificationDto, SmsNotificationDto, WebhookNotificationDto } from '../dto/notification.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MetricsService } from '../core/services/metrics.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly metrics: MetricsService,
  ) {}

  @Post('email')
  @ApiOperation({ summary: 'Enviar notificación por correo electrónico' })
  @ApiResponse({ status: 201, description: 'Notificación enviada exitosamente' })
  async sendEmail(@Body() emailNotificationDto: EmailNotificationDto) {
    return this.notificationService.create({
      ...emailNotificationDto,
      type: 'email',
    });
  }

  @Post('sms')
  @ApiOperation({ summary: 'Enviar notificación por SMS' })
  @ApiResponse({ status: 201, description: 'Notificación enviada exitosamente' })
  async sendSMS(@Body() smsNotificationDto: SmsNotificationDto) {
    return this.notificationService.create({
      ...smsNotificationDto,
      type: 'sms',
    });
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Enviar notificación por webhook' })
  @ApiResponse({ status: 201, description: 'Notificación enviada exitosamente' })
  async sendWebhook(@Body() webhookNotificationDto: WebhookNotificationDto) {
    return this.notificationService.create({
      ...webhookNotificationDto,
      type: 'webhook',
    });
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtener notificaciones pendientes' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones pendientes' })
  async findPending() {
    return this.notificationService.findPending();
  }

  @Get('failed')
  @ApiOperation({ summary: 'Obtener notificaciones fallidas' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones fallidas' })
  async findFailed() {
    return this.notificationService.findFailed();
  }

  @Put(':id/retry')
  @ApiOperation({ summary: 'Reintentar notificación fallida' })
  @ApiResponse({ status: 200, description: 'Notificación reintentada exitosamente' })
  async retryFailed(@Param('id') id: string) {
    const notification = await this.notificationService.findOne(id);
    await this.notificationService.retryFailed(notification);
    return notification;
  }
} 