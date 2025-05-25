import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export interface ProductModel extends Model<Product> {
  findLowStock(): Promise<Product[]>;
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  zone: string;

  @Prop({ required: true, min: 0 })
  currentStock: number;

  @Prop({ required: true, min: 0 })
  minStock: number;

  @Prop({ required: true, min: 0 })
  maxStock: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: 'active' })
  status: string;

  needsReorder(): boolean {
    return this.currentStock <= this.minStock;
  }

  updateStock(quantity: number, type: 'add' | 'remove'): void {
    if (type === 'add') {
      this.currentStock += quantity;
    } else {
      this.currentStock = Math.max(0, this.currentStock - quantity);
    }
  }
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Índices
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ zone: 1 });
ProductSchema.index({ status: 1 });

// Métodos estáticos
ProductSchema.statics.findLowStock = function() {
  return this.find({
    currentStock: { $lte: '$minStock' },
    status: 'active'
  });
}; 