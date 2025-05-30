import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Module({
  providers: [InventoryService],
  exports: [InventoryService],
})
export class ServicesModule {} 