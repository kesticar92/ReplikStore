import { IsString, IsEnum, IsOptional, IsObject, IsDate, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportType {
  INVENTORY = 'inventory',
  SALES = 'sales',
  USERS = 'users',
  NOTIFICATIONS = 'notifications'
}

export enum ReportFormat {
  EXCEL = 'excel',
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json'
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class CreateReportDto {
  @ApiProperty({ description: 'Tipo de reporte', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Formato del reporte', enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiProperty({ description: 'Parámetros del reporte', required: false })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiProperty({ description: 'Programar reporte', required: false })
  @IsBoolean()
  @IsOptional()
  isScheduled?: boolean;

  @ApiProperty({ description: 'Fecha de programación', required: false })
  @IsDate()
  @IsOptional()
  scheduledDate?: Date;
}

export class ReportFilterDto {
  @ApiProperty({ description: 'Filtrar por tipo', enum: ReportType, required: false })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @ApiProperty({ description: 'Filtrar por estado', enum: ReportStatus, required: false })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiProperty({ description: 'Filtrar por fecha de inicio', required: false })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ description: 'Filtrar por fecha de fin', required: false })
  @IsDate()
  @IsOptional()
  endDate?: Date;
} 