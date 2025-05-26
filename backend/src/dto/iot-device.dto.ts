import { IsString, IsEnum, IsOptional, IsObject, IsNumber, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType, DeviceStatus } from '../models/iot-device.model';

export class CreateIotDeviceDto {
  @ApiProperty({ description: 'Nombre del dispositivo' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID único del dispositivo' })
  @IsString()
  deviceId: string;

  @ApiProperty({ description: 'Tipo de dispositivo', enum: DeviceType })
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiProperty({ description: 'Ubicación del dispositivo' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Zona del dispositivo' })
  @IsString()
  zone: string;

  @ApiProperty({ description: 'Versión del firmware' })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @ApiProperty({ description: 'Metadatos adicionales' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Configuración del dispositivo' })
  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}

export class UpdateIotDeviceDto {
  @ApiProperty({ description: 'Nombre del dispositivo' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Ubicación del dispositivo' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Zona del dispositivo' })
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiProperty({ description: 'Versión del firmware' })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @ApiProperty({ description: 'Metadatos adicionales' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Configuración del dispositivo' })
  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}

export class DeviceReadingDto {
  @ApiProperty({ description: 'Valor de la lectura' })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Unidad de medida' })
  @IsString()
  unit: string;
}

export class DeviceFilterDto {
  @ApiProperty({ description: 'Filtrar por tipo', enum: DeviceType, required: false })
  @IsEnum(DeviceType)
  @IsOptional()
  type?: DeviceType;

  @ApiProperty({ description: 'Filtrar por estado', enum: DeviceStatus, required: false })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @ApiProperty({ description: 'Filtrar por ubicación', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Filtrar por zona', required: false })
  @IsString()
  @IsOptional()
  zone?: string;
}

export class MaintenanceScheduleDto {
  @ApiProperty({ description: 'Fecha de mantenimiento' })
  @IsDate()
  date: Date;
} 