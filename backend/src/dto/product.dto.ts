import { IsString, IsNumber, IsOptional, Min, IsObject, IsEnum } from 'class-validator';
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

  @ApiProperty({ description: 'Precio del producto' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Cantidad en stock' })
  @IsNumber()
  @Min(0)
  stock: number;

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

  @ApiProperty({ description: 'Nombre del producto', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Descripción del producto', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Precio del producto', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ description: 'Cantidad en stock', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ description: 'Categoría del producto', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}

export class StockUpdateDto {
  @ApiProperty({ description: 'Cantidad a actualizar' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Tipo de operación', enum: ['add', 'subtract'] })
  @IsEnum(['add', 'subtract'])
  operation: 'add' | 'subtract';
}

export class ProductFilterDto {
  @ApiProperty({ description: 'Filtrar por categoría', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Filtrar por stock mínimo', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiProperty({ description: 'Filtrar por precio máximo', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;
} 