import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from '../services/inventory.service';
import { CreateProductDto, UpdateProductDto, StockUpdateDto } from '../dto/product.dto';
import { Product } from '../models/product.model';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../dto/user.dto';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente', type: Product })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.inventoryService.create(createProductDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({ status: 200, description: 'Lista de productos', type: [Product] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Query() query: any): Promise<Product[]> {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener productos con bajo stock' })
  @ApiResponse({ status: 200, description: 'Lista de productos con bajo stock', type: [Product] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findLowStock(): Promise<Product[]> {
    return this.inventoryService.findLowStock();
  }

  @Get(':sku')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Obtener un producto por SKU' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: Product })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findOne(@Param('sku') sku: string): Promise<Product> {
    return this.inventoryService.findOne(sku);
  }

  @Patch(':sku')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: Product })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async update(
    @Param('sku') sku: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.inventoryService.update(sku, updateProductDto);
  }

  @Patch(':sku/stock')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Actualizar el stock de un producto' })
  @ApiResponse({ status: 200, description: 'Stock actualizado', type: Product })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async updateStock(
    @Param('sku') sku: string,
    @Body() stockUpdateDto: StockUpdateDto,
  ): Promise<Product> {
    return this.inventoryService.updateStock(sku, stockUpdateDto);
  }

  @Delete(':sku')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async remove(@Param('sku') sku: string): Promise<void> {
    return this.inventoryService.delete(sku);
  }
} 