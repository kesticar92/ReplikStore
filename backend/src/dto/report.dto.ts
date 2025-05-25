import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportFormat } from '../models/report.model';

class ScheduleDto {
  @ApiProperty({ description: 'Frecuencia de generación del reporte' })
  @IsString()
  frequency: string;

  @ApiPropertyOptional({ description: 'Fecha de la próxima ejecución' })
  @IsDateString()
  @IsOptional()
  nextRun?: string;
}

export class CreateReportDto {
  @ApiProperty({ description: 'Tipo de reporte', enum: ['inventory', 'sales', 'performance', 'custom'] })
  @IsEnum(['inventory', 'sales', 'performance', 'custom'])
  type: ReportType;

  @ApiProperty({ description: 'Nombre del reporte' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del reporte' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Parámetros del reporte' })
  @IsObject()
  parameters: Record<string, any>;

  @ApiProperty({ description: 'Formato del reporte', enum: ['pdf', 'excel', 'csv', 'json'] })
  @IsEnum(['pdf', 'excel', 'csv', 'json'])
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Indica si el reporte está programado' })
  @IsBoolean()
  @IsOptional()
  isScheduled?: boolean;

  @ApiPropertyOptional({ description: 'Configuración de programación' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  @IsOptional()
  schedule?: ScheduleDto;
}

export class UpdateReportDto {
  @ApiPropertyOptional({ description: 'Estado del reporte' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Mensaje de error' })
  @IsString()
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({ description: 'URL del archivo generado' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Tamaño del archivo en bytes' })
  @IsOptional()
  fileSize?: number;
}

export class ReportFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por tipo de reporte' })
  @IsEnum(['inventory', 'sales', 'performance', 'custom'])
  @IsOptional()
  type?: ReportType;

  @ApiPropertyOptional({ description: 'Filtrar por estado' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrar por fecha de inicio' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por fecha de fin' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
} 