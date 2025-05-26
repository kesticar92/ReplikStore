import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationType, NotificationFilterDto } from '../dto/notification.dto';
import { Notification } from '../models/notification.model';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../dto/user.dto';
import { MetricsService } from '../core/services/metrics.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly metrics: MetricsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Crear una nueva notificación' })
  @ApiResponse({ status: 201, description: 'Notificación creada exitosamente', type: Notification })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener todas las notificaciones' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones', type: [Notification] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Query() filter: NotificationFilterDto): Promise<Notification[]> {
    return this.notificationService.findAll(filter);
  }

  @Get('failed')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener notificaciones fallidas' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones fallidas', type: [Notification] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async findFailed(): Promise<Notification[]> {
    return this.notificationService.findFailed();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener una notificación por ID' })
  @ApiResponse({ status: 200, description: 'Notificación encontrada', type: Notification })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findOne(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar una notificación' })
  @ApiResponse({ status: 200, description: 'Notificación actualizada', type: Notification })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Post(':id/retry')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reintentar una notificación fallida' })
  @ApiResponse({ status: 200, description: 'Notificación reintentada', type: Notification })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  @ApiResponse({ status: 400, description: 'La notificación no está en estado fallido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async retryFailed(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.retryFailed(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar una notificación' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.notificationService.delete(id);
  }

  @Post('email')
  @ApiOperation({ summary: 'Enviar notificación por correo electrónico' })
  @ApiResponse({ status: 201, description: 'Notificación enviada exitosamente' })
  async sendEmail(@Body() emailNotificationDto: Omit<CreateNotificationDto, 'type'>) {
    return this.notificationService.create({
      ...emailNotificationDto,
      type: NotificationType.EMAIL,
    });
  }

  @Post('sms')
  @ApiOperation({ summary: 'Enviar notificación por SMS' })
  @ApiResponse({ status: 201, description: 'Notificación enviada exitosamente' })
  async sendSMS(@Body() smsNotificationDto: Omit<CreateNotificationDto, 'type'>) {
    return this.notificationService.create({
      ...smsNotificationDto,
      type: NotificationType.SMS,
    });
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Enviar notificación por webhook' })
  @ApiResponse({ status: 201, description: 'Notificación enviada exitosamente' })
  async sendWebhook(@Body() webhookNotificationDto: Omit<CreateNotificationDto, 'type'>) {
    return this.notificationService.create({
      ...webhookNotificationDto,
      type: NotificationType.WEBHOOK,
    });
  }
} 