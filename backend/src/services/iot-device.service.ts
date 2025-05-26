import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IotDevice, DeviceStatus } from '../models/iot-device.model';
import { CreateIotDeviceDto, UpdateIotDeviceDto, DeviceReadingDto, DeviceFilterDto, MaintenanceScheduleDto } from '../dto/iot-device.dto';
import { LoggerService } from '../core/services/logger.service';
import { MetricsService } from '../core/services/metrics.service';
import { NotificationService } from './notification.service';
import { NotificationType } from '../dto/notification.dto';

@Injectable()
export class IotDeviceService {
  constructor(
    @InjectModel(IotDevice.name) private iotDeviceModel: Model<IotDevice>,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createIotDeviceDto: CreateIotDeviceDto): Promise<IotDevice> {
    try {
      const device = new this.iotDeviceModel(createIotDeviceDto);
      const saved = await device.save();
      this.metrics.increment('iot.devices.created');
      return saved;
    } catch (error) {
      this.logger.error('Error creating IoT device', error);
      throw error;
    }
  }

  async findAll(filter: DeviceFilterDto): Promise<IotDevice[]> {
    try {
      const query: Record<string, any> = {};
      if (filter.type) query.type = filter.type;
      if (filter.status) query.status = filter.status;
      if (filter.location) query.location = filter.location;
      if (filter.zone) query.zone = filter.zone;

      return await this.iotDeviceModel.find(query).exec();
    } catch (error) {
      this.logger.error('Error finding IoT devices', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<IotDevice> {
    try {
      const device = await this.iotDeviceModel.findById(id).exec();
      if (!device) {
        throw new NotFoundException(`IoT device with ID ${id} not found`);
      }
      return device;
    } catch (error) {
      this.logger.error(`Error finding IoT device ${id}`, error);
      throw error;
    }
  }

  async findByDeviceId(deviceId: string): Promise<IotDevice> {
    try {
      const device = await this.iotDeviceModel.findOne({ deviceId }).exec();
      if (!device) {
        throw new NotFoundException(`IoT device with deviceId ${deviceId} not found`);
      }
      return device;
    } catch (error) {
      this.logger.error(`Error finding IoT device with deviceId ${deviceId}`, error);
      throw error;
    }
  }

  async update(id: string, updateIotDeviceDto: UpdateIotDeviceDto): Promise<IotDevice> {
    try {
      const device = await this.iotDeviceModel
        .findByIdAndUpdate(id, updateIotDeviceDto, { new: true })
        .exec();
      if (!device) {
        throw new NotFoundException(`IoT device with ID ${id} not found`);
      }
      this.metrics.increment('iot.devices.updated');
      return device;
    } catch (error) {
      this.logger.error(`Error updating IoT device ${id}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.iotDeviceModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`IoT device with ID ${id} not found`);
      }
      this.metrics.increment('iot.devices.deleted');
    } catch (error) {
      this.logger.error(`Error deleting IoT device ${id}`, error);
      throw error;
    }
  }

  async updateStatus(id: string, status: DeviceStatus, errorMessage?: string): Promise<IotDevice> {
    try {
      const device = await this.findOne(id);
      
      switch (status) {
        case DeviceStatus.ONLINE:
          device.markAsOnline();
          break;
        case DeviceStatus.OFFLINE:
          device.markAsOffline();
          break;
        case DeviceStatus.MAINTENANCE:
          device.markAsMaintenance();
          break;
        case DeviceStatus.ERROR:
          if (errorMessage) {
            device.markAsError(errorMessage);
          }
          break;
      }

      const saved = await device.save();
      this.metrics.increment(`iot.devices.status.${status.toLowerCase()}`);
      return saved;
    } catch (error) {
      this.logger.error(`Error updating IoT device status ${id}`, error);
      throw error;
    }
  }

  async updateReading(id: string, reading: DeviceReadingDto): Promise<IotDevice> {
    try {
      const device = await this.findOne(id);
      device.updateReading(reading.value, reading.unit);
      const saved = await device.save();
      this.metrics.increment('iot.devices.readings');
      return saved;
    } catch (error) {
      this.logger.error(`Error updating IoT device reading ${id}`, error);
      throw error;
    }
  }

  async scheduleMaintenance(id: string, schedule: MaintenanceScheduleDto): Promise<IotDevice> {
    try {
      const device = await this.findOne(id);
      device.scheduleMaintenance(schedule.date);
      const saved = await device.save();

      // Notificar al equipo de mantenimiento
      await this.notificationService.create({
        type: NotificationType.EMAIL,
        recipient: 'maintenance@replikstore.com',
        subject: 'Mantenimiento programado',
        content: `Se ha programado mantenimiento para el dispositivo ${device.name} (${device.deviceId}) el ${schedule.date}`,
        metadata: {
          deviceId: device._id,
          deviceName: device.name,
          maintenanceDate: schedule.date,
        },
      });

      this.metrics.increment('iot.devices.maintenance.scheduled');
      return saved;
    } catch (error) {
      this.logger.error(`Error scheduling maintenance for IoT device ${id}`, error);
      throw error;
    }
  }

  async getDevicesByStatus(status: DeviceStatus): Promise<IotDevice[]> {
    try {
      return await this.iotDeviceModel.find({ status }).exec();
    } catch (error) {
      this.logger.error(`Error finding IoT devices with status ${status}`, error);
      throw error;
    }
  }

  async getDevicesByType(type: string): Promise<IotDevice[]> {
    try {
      return await this.iotDeviceModel.find({ type }).exec();
    } catch (error) {
      this.logger.error(`Error finding IoT devices with type ${type}`, error);
      throw error;
    }
  }

  async getDevicesByLocation(location: string): Promise<IotDevice[]> {
    try {
      return await this.iotDeviceModel.find({ location }).exec();
    } catch (error) {
      this.logger.error(`Error finding IoT devices in location ${location}`, error);
      throw error;
    }
  }
} 