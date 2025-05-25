import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from '../controllers/inventory.controller';
import { InventoryService } from '../services/inventory.service';
import { Product, ProductSchema } from '../models/product.model';
import { CacheModule } from '@nestjs/cache-manager';
import { MetricsModule } from './metrics.module';
import { LoggerModule } from './logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema }
    ]),
    CacheModule.register(),
    MetricsModule,
    LoggerModule
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService]
})
export class InventoryModule {} 