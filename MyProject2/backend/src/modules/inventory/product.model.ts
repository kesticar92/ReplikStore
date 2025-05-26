import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
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

  @Prop({ required: true, default: 0 })
  currentStock: number;

  @Prop({ required: true })
  minStock: number;

  @Prop({ required: true })
  maxStock: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'discontinued'] })
  status: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product); 