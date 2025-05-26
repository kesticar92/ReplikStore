import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('sensors')
@Controller('sensors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo sensor' })
  @ApiResponse({ status: 201, description: 'Sensor creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createSensorDto: CreateSensorDto) {
    try {
      return await this.sensorsService.create(createSensorDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los sensores' })
  @ApiResponse({ status: 200, description: 'Lista de sensores obtenida exitosamente' })
  async findAll() {
    return this.sensorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un sensor por ID' })
  @ApiResponse({ status: 200, description: 'Sensor encontrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async findOne(@Param('id') id: string) {
    const sensor = await this.sensorsService.findOne(id);
    if (!sensor) {
      throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
    }
    return sensor;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un sensor' })
  @ApiResponse({ status: 200, description: 'Sensor actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async update(@Param('id') id: string, @Body() updateSensorDto: UpdateSensorDto) {
    const sensor = await this.sensorsService.update(id, updateSensorDto);
    if (!sensor) {
      throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
    }
    return sensor;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un sensor' })
  @ApiResponse({ status: 200, description: 'Sensor eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async remove(@Param('id') id: string) {
    const sensor = await this.sensorsService.remove(id);
    if (!sensor) {
      throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
    }
    return sensor;
  }

  @Post(':id/data')
  @ApiOperation({ summary: 'Registrar datos de un sensor' })
  @ApiResponse({ status: 201, description: 'Datos registrados exitosamente' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async createSensorData(
    @Param('id') id: string,
    @Body() createSensorDataDto: CreateSensorDataDto,
  ) {
    createSensorDataDto.sensorId = id;
    try {
      return await this.sensorsService.createSensorData(createSensorDataDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Obtener datos de un sensor' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos exitosamente' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getSensorData(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sensorsService.getSensorData(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
} 