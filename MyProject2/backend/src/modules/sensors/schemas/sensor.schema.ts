import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SensorDocument = Sensor & Document;

@Schema({ timestamps: true })
export class Sensor {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, enum: ['active', 'inactive', 'maintenance'] })
  status: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true, type: Number })
  threshold: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const SensorSchema = SchemaFactory.createForClass(Sensor); 