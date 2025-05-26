import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SensorsService } from './sensors.service';
import { SensorsController } from './sensors.controller';
import { SensorsGateway } from './sensors.gateway';
import { Sensor, SensorSchema } from './schemas/sensor.schema';
import { SensorData, SensorDataSchema } from './schemas/sensor-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sensor.name, schema: SensorSchema },
      { name: SensorData.name, schema: SensorDataSchema },
    ]),
  ],
  controllers: [SensorsController],
  providers: [SensorsService, SensorsGateway],
  exports: [SensorsService],
})
export class SensorsModule {} 