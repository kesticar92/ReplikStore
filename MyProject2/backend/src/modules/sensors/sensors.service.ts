import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sensor, SensorDocument } from './schemas/sensor.schema';
import { SensorData, SensorDataDocument } from './schemas/sensor-data.schema';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { SensorsGateway } from './sensors.gateway';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(
    @InjectModel(Sensor.name) private sensorModel: Model<SensorDocument>,
    @InjectModel(SensorData.name) private sensorDataModel: Model<SensorDataDocument>,
    private sensorsGateway: SensorsGateway,
  ) {}

  async create(createSensorDto: CreateSensorDto): Promise<Sensor> {
    const createdSensor = new this.sensorModel(createSensorDto);
    return createdSensor.save();
  }

  async findAll(): Promise<Sensor[]> {
    return this.sensorModel.find().exec();
  }

  async findOne(id: string): Promise<Sensor> {
    return this.sensorModel.findById(id).exec();
  }

  async update(id: string, updateSensorDto: UpdateSensorDto): Promise<Sensor> {
    return this.sensorModel
      .findByIdAndUpdate(id, updateSensorDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Sensor> {
    return this.sensorModel.findByIdAndDelete(id).exec();
  }

  async createSensorData(createSensorDataDto: CreateSensorDataDto): Promise<SensorData> {
    const sensor = await this.sensorModel.findById(createSensorDataDto.sensorId);
    if (!sensor) {
      throw new Error('Sensor not found');
    }

    const sensorData = new this.sensorDataModel(createSensorDataDto);
    const savedData = await sensorData.save();

    // Notificar a los clientes conectados sobre los nuevos datos
    await this.sensorsGateway.notifySensorData(sensor.id, savedData);

    // Verificar si el valor está por debajo del umbral
    if (sensorData.value < sensor.threshold) {
      this.logger.warn(
        `Sensor ${sensor.name} (${sensor.id}) está por debajo del umbral: ${sensorData.value} < ${sensor.threshold}`,
      );
      
      // Notificar alerta a los clientes conectados
      await this.sensorsGateway.notifySensorAlert(sensor.id, {
        type: 'LOW_THRESHOLD',
        message: `El sensor ${sensor.name} está por debajo del umbral`,
        value: sensorData.value,
        threshold: sensor.threshold,
      });
    }

    return savedData;
  }

  async getSensorData(sensorId: string, startDate?: Date, endDate?: Date): Promise<SensorData[]> {
    const query: any = { sensorId };
    if (startDate && endDate) {
      query.timestamp = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    return this.sensorDataModel.find(query).sort({ timestamp: -1 }).exec();
  }
} 