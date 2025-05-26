import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DeviceType {
  SENSOR = 'sensor',
  ACTUATOR = 'actuator',
  GATEWAY = 'gateway'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

@Schema({ timestamps: true })
export class IotDevice extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true, enum: DeviceType })
  type: DeviceType;

  @Prop({ required: true, enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;

  @Prop()
  location: string;

  @Prop()
  zone: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Object })
  lastReading: {
    timestamp: Date;
    value: number;
    unit: string;
  };

  @Prop()
  firmwareVersion: string;

  @Prop()
  lastMaintenance: Date;

  @Prop()
  nextMaintenance: Date;

  @Prop({ type: Object })
  configuration: Record<string, any>;

  @Prop()
  errorMessage?: string;

  markAsOnline(): void {
    this.status = DeviceStatus.ONLINE;
  }

  markAsOffline(): void {
    this.status = DeviceStatus.OFFLINE;
  }

  markAsMaintenance(): void {
    this.status = DeviceStatus.MAINTENANCE;
  }

  markAsError(errorMessage: string): void {
    this.status = DeviceStatus.ERROR;
    this.errorMessage = errorMessage;
  }

  updateReading(value: number, unit: string): void {
    this.lastReading = {
      timestamp: new Date(),
      value,
      unit
    };
  }

  scheduleMaintenance(date: Date): void {
    this.nextMaintenance = date;
  }
}

export const IotDeviceSchema = SchemaFactory.createForClass(IotDevice);

// Índices
IotDeviceSchema.index({ deviceId: 1 }, { unique: true });
IotDeviceSchema.index({ type: 1, status: 1 });
IotDeviceSchema.index({ location: 1, zone: 1 });
IotDeviceSchema.index({ 'lastReading.timestamp': 1 }); 