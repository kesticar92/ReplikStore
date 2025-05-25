import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductModel } from '../models/product.model';
import { CreateProductDto, UpdateProductDto, StockUpdateDto } from '../dto/product.dto';
import { LoggerService } from '../core/services/logger.service';
import { CacheService } from '../core/services/cache.service';
import { MetricsService } from '../core/services/metrics.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Product.name) private productModel: ProductModel,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
    private readonly metrics: MetricsService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product = new this.productModel(createProductDto);
      await product.save();
      
      this.metrics.incrementCounter('inventory_operations_total', {
        operation: 'create',
        status: 'success',
      });

      return product;
    } catch (error) {
      this.metrics.incrementCounter('inventory_operations_total', {
        operation: 'create',
        status: 'error',
      });
      throw error;
    }
  }

  async findAll(query: any = {}): Promise<Product[]> {
    const start = Date.now();
    try {
      const cacheKey = `products:${JSON.stringify(query)}`;
      const cached = await this.cache.get<Product[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const products = await this.productModel.find(query).exec();
      await this.cache.set(cacheKey, products, 300); // Cache for 5 minutes

      this.metrics.observeHistogram('inventory_operation_duration_seconds', 
        (Date.now() - start) / 1000,
        { operation: 'findAll' }
      );

      return products;
    } catch (error) {
      this.logger.error('Error finding products:', error);
      throw error;
    }
  }

  async findOne(sku: string): Promise<Product> {
    try {
      const product = await this.productModel.findOne({ sku }).exec();
      if (!product) {
        throw new NotFoundException(`Product with SKU ${sku} not found`);
      }
      return product;
    } catch (error) {
      this.logger.error(`Error finding product ${sku}:`, error);
      throw error;
    }
  }

  async update(sku: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.productModel.findOneAndUpdate(
        { sku },
        updateProductDto,
        { new: true }
      ).exec();

      if (!product) {
        throw new NotFoundException(`Product with SKU ${sku} not found`);
      }

      // Invalidar caché
      await this.cache.delete(`products:${sku}`);

      return product;
    } catch (error) {
      this.logger.error(`Error updating product ${sku}:`, error);
      throw error;
    }
  }

  async updateStock(sku: string, stockUpdateDto: StockUpdateDto): Promise<Product> {
    const start = Date.now();
    try {
      const product = await this.findOne(sku);
      
      if (stockUpdateDto.type === 'remove' && product.currentStock < stockUpdateDto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      product.updateStock(stockUpdateDto.quantity, stockUpdateDto.type);
      await product.save();

      // Invalidar caché
      await this.cache.delete(`products:${sku}`);

      this.metrics.observeHistogram('inventory_operation_duration_seconds',
        (Date.now() - start) / 1000,
        { operation: 'updateStock' }
      );

      return product;
    } catch (error) {
      this.logger.error(`Error updating stock for product ${sku}:`, error);
      throw error;
    }
  }

  async findLowStock(): Promise<Product[]> {
    try {
      return await this.productModel.findLowStock();
    } catch (error) {
      this.logger.error('Error finding low stock products:', error);
      throw error;
    }
  }

  async delete(sku: string): Promise<void> {
    try {
      const result = await this.productModel.deleteOne({ sku }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Product with SKU ${sku} not found`);
      }
      
      // Invalidar caché
      await this.cache.delete(`products:${sku}`);
    } catch (error) {
      this.logger.error(`Error deleting product ${sku}:`, error);
      throw error;
    }
  }
} 