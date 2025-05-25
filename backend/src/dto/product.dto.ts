import { IsString, IsNumber, IsOptional, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'SKU del producto' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Categoría del producto' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Zona del producto' })
  @IsString()
  zone: string;

  @ApiProperty({ description: 'Stock actual' })
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty({ description: 'Stock mínimo' })
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiProperty({ description: 'Stock máximo' })
  @IsNumber()
  @Min(0)
  maxStock: number;

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateProductDto extends CreateProductDto {
  @ApiPropertyOptional({ description: 'Estado del producto' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class StockUpdateDto {
  @ApiProperty({ description: 'Cantidad a actualizar' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Tipo de operación (add/remove)' })
  @IsString()
  type: 'add' | 'remove';
} 