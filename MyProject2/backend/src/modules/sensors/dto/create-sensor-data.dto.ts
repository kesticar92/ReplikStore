import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSensorDataDto {
  @ApiProperty({ description: 'ID del sensor' })
  @IsString()
  sensorId: string;

  @ApiProperty({ description: 'Valor del sensor' })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Unidad de medida' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Metadatos adicionales', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Fecha y hora de la lectura', required: false })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  timestamp?: Date;
} 