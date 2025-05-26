import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Sensor } from './sensor.schema';

export type SensorDataDocument = SensorData & Document;

@Schema({ timestamps: true })
export class SensorData {
  @Prop({ type: Types.ObjectId, ref: 'Sensor', required: true })
  sensorId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  value: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp: Date;
}

export const SensorDataSchema = SchemaFactory.createForClass(SensorData); 