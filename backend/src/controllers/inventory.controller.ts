import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from '../services/inventory.service';
import { CreateProductDto, UpdateProductDto, StockUpdateDto } from '../dto/product.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MetricsService } from '../core/services/metrics.service';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly metrics: MetricsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.inventoryService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  async findAll(@Query() query: any) {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Obtener productos con stock bajo' })
  @ApiResponse({ status: 200, description: 'Lista de productos con stock bajo' })
  async findLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Get(':sku')
  @ApiOperation({ summary: 'Obtener un producto por SKU' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('sku') sku: string) {
    return this.inventoryService.findOne(sku);
  }

  @Put(':sku')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async update(
    @Param('sku') sku: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.inventoryService.update(sku, updateProductDto);
  }

  @Put(':sku/stock')
  @ApiOperation({ summary: 'Actualizar el stock de un producto' })
  @ApiResponse({ status: 200, description: 'Stock actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async updateStock(
    @Param('sku') sku: string,
    @Body() stockUpdateDto: StockUpdateDto,
  ) {
    return this.inventoryService.updateStock(sku, stockUpdateDto);
  }

  @Delete(':sku')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async delete(@Param('sku') sku: string) {
    return this.inventoryService.delete(sku);
  }
} 