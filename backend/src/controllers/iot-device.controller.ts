import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IotDeviceService } from '../services/iot-device.service';
import { CreateIotDeviceDto, UpdateIotDeviceDto, DeviceReadingDto, DeviceFilterDto, MaintenanceScheduleDto } from '../dto/iot-device.dto';
import { IotDevice, DeviceStatus } from '../models/iot-device.model';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../dto/user.dto';
import { MetricsService } from '../core/services/metrics.service';

@ApiTags('iot-devices')
@Controller('iot-devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IotDeviceController {
  constructor(
    private readonly iotDeviceService: IotDeviceService,
    private readonly metrics: MetricsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo dispositivo IoT' })
  @ApiResponse({ status: 201, description: 'Dispositivo creado exitosamente', type: IotDevice })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async create(@Body() createIotDeviceDto: CreateIotDeviceDto): Promise<IotDevice> {
    const device = await this.iotDeviceService.create(createIotDeviceDto);
    this.metrics.increment('iot.devices.created');
    return device;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener todos los dispositivos IoT' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos', type: [IotDevice] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Query() filter: DeviceFilterDto): Promise<IotDevice[]> {
    return this.iotDeviceService.findAll(filter);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener un dispositivo IoT por ID' })
  @ApiResponse({ status: 200, description: 'Dispositivo encontrado', type: IotDevice })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findOne(@Param('id') id: string): Promise<IotDevice> {
    return this.iotDeviceService.findOne(id);
  }

  @Get('device/:deviceId')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener un dispositivo IoT por deviceId' })
  @ApiResponse({ status: 200, description: 'Dispositivo encontrado', type: IotDevice })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findByDeviceId(@Param('deviceId') deviceId: string): Promise<IotDevice> {
    return this.iotDeviceService.findByDeviceId(deviceId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un dispositivo IoT' })
  @ApiResponse({ status: 200, description: 'Dispositivo actualizado', type: IotDevice })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async update(
    @Param('id') id: string,
    @Body() updateIotDeviceDto: UpdateIotDeviceDto,
  ): Promise<IotDevice> {
    const device = await this.iotDeviceService.update(id, updateIotDeviceDto);
    this.metrics.increment('iot.devices.updated');
    return device;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un dispositivo IoT' })
  @ApiResponse({ status: 200, description: 'Dispositivo eliminado' })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.iotDeviceService.delete(id);
    this.metrics.increment('iot.devices.deleted');
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Actualizar el estado de un dispositivo IoT' })
  @ApiResponse({ status: 200, description: 'Estado actualizado', type: IotDevice })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: DeviceStatus,
    @Body('errorMessage') errorMessage?: string,
  ): Promise<IotDevice> {
    return this.iotDeviceService.updateStatus(id, status, errorMessage);
  }

  @Post(':id/reading')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Actualizar la lectura de un dispositivo IoT' })
  @ApiResponse({ status: 200, description: 'Lectura actualizada', type: IotDevice })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateReading(
    @Param('id') id: string,
    @Body() reading: DeviceReadingDto,
  ): Promise<IotDevice> {
    return this.iotDeviceService.updateReading(id, reading);
  }

  @Post(':id/maintenance')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Programar mantenimiento para un dispositivo IoT' })
  @ApiResponse({ status: 200, description: 'Mantenimiento programado', type: IotDevice })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async scheduleMaintenance(
    @Param('id') id: string,
    @Body() schedule: MaintenanceScheduleDto,
  ): Promise<IotDevice> {
    return this.iotDeviceService.scheduleMaintenance(id, schedule);
  }

  @Get('status/:status')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener dispositivos IoT por estado' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos', type: [IotDevice] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getDevicesByStatus(@Param('status') status: DeviceStatus): Promise<IotDevice[]> {
    return this.iotDeviceService.getDevicesByStatus(status);
  }

  @Get('type/:type')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener dispositivos IoT por tipo' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos', type: [IotDevice] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getDevicesByType(@Param('type') type: string): Promise<IotDevice[]> {
    return this.iotDeviceService.getDevicesByType(type);
  }

  @Get('location/:location')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Obtener dispositivos IoT por ubicación' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos', type: [IotDevice] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getDevicesByLocation(@Param('location') location: string): Promise<IotDevice[]> {
    return this.iotDeviceService.getDevicesByLocation(location);
  }
} 