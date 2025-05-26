import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  zone: string;

  @ApiProperty()
  @IsNumber()
  currentStock: number;

  @ApiProperty()
  @IsNumber()
  minStock: number;

  @ApiProperty()
  @IsNumber()
  maxStock: number;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ enum: ['active', 'inactive', 'discontinued'], required: false })
  @IsEnum(['active', 'inactive', 'discontinued'])
  @IsOptional()
  status?: string;
}

export class StockUpdateDto {
  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ enum: ['add', 'remove'] })
  @IsEnum(['add', 'remove'])
  operation: 'add' | 'remove';
} 