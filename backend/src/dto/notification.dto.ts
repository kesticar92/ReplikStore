import { IsString, IsEnum, IsOptional, IsObject, IsEmail, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../models/notification.model';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Tipo de notificación', enum: ['email', 'sms', 'webhook'] })
  @IsEnum(['email', 'sms', 'webhook'])
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

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ description: 'Estado de la notificación' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Mensaje de error' })
  @IsString()
  @IsOptional()
  error?: string;
}

export class EmailNotificationDto extends CreateNotificationDto {
  @ApiProperty({ description: 'Correo electrónico del destinatario' })
  @IsEmail()
  recipient: string;
}

export class SmsNotificationDto extends CreateNotificationDto {
  @ApiProperty({ description: 'Número de teléfono del destinatario' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'El número de teléfono debe estar en formato internacional (E.164)',
  })
  recipient: string;
}

export class WebhookNotificationDto extends CreateNotificationDto {
  @ApiProperty({ description: 'URL del webhook' })
  @Matches(
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    {
      message: 'La URL del webhook debe ser válida',
    },
  )
  recipient: string;
} 