import { IsString, IsEnum, IsOptional, IsObject, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'Tipo de notificación', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Destinatario de la notificación' })
  @IsString()
  recipient: string;

  @ApiProperty({ description: 'Asunto de la notificación' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Contenido de la notificación' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Metadatos adicionales', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Estado de la notificación', enum: NotificationStatus, required: false })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({ description: 'Mensaje de error', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ description: 'Metadatos adicionales', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class NotificationFilterDto {
  @ApiProperty({ description: 'Filtrar por tipo', enum: NotificationType, required: false })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({ description: 'Filtrar por estado', enum: NotificationStatus, required: false })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({ description: 'Filtrar por destinatario', required: false })
  @IsString()
  @IsOptional()
  recipient?: string;
}

export class EmailNotificationDto {
  @ApiProperty({ description: 'Correo electrónico del destinatario' })
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'Asunto del correo' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Contenido del correo' })
  @IsString()
  content: string;
}

export class SmsNotificationDto {
  @ApiProperty({ description: 'Número de teléfono del destinatario' })
  @IsString()
  to: string;

  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsString()
  content: string;
}

export class WebhookNotificationDto {
  @ApiProperty({ description: 'URL del webhook' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Datos a enviar' })
  @IsObject()
  data: Record<string, any>;
} 