import { Module } from '@nestjs/common';
import { InventoryModule } from '../modules/inventory.module';

@Module({
  imports: [InventoryModule],
  exports: [InventoryModule],
})
export class ApiModule {} 