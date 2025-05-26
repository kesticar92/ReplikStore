import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateSensorDto {
  @ApiProperty({ description: 'Nombre del sensor' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tipo de sensor' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Ubicación del sensor' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Estado del sensor' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Descripción del sensor', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ID del producto asociado' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Umbral de alerta' })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Estado activo del sensor', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 