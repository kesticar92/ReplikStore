import { Test, TestingModule } from '@nestjs/testing';
import { IotDeviceController } from '../controllers/iot-device.controller';
import { IotDeviceService } from '../services/iot-device.service';
import { MetricsService } from '../core/services/metrics.service';
import { CreateIotDeviceDto, UpdateIotDeviceDto, DeviceReadingDto, MaintenanceScheduleDto } from '../dto/iot-device.dto';
import { IotDevice, DeviceStatus, DeviceType } from '../models/iot-device.model';

describe('IotDeviceController', () => {
  let controller: IotDeviceController;
  let service: IotDeviceService;
  let metrics: MetricsService;

  const mockDevice: Partial<IotDevice> = {
    id: '1',
    name: 'Test Device',
    deviceId: 'DEVICE123',
    type: DeviceType.SENSOR,
    status: DeviceStatus.ONLINE,
    location: 'Warehouse A',
    zone: 'Zone 1',
    firmwareVersion: '1.0.0',
    lastReading: {
      timestamp: new Date(),
      value: 25.5,
      unit: 'C',
    },
    metadata: {
      manufacturer: 'Test Corp',
      model: 'TS-100',
    },
  };

  const mockIotDeviceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDeviceId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    updateReading: jest.fn(),
    scheduleMaintenance: jest.fn(),
    getDevicesByStatus: jest.fn(),
    getDevicesByType: jest.fn(),
    getDevicesByLocation: jest.fn(),
  };

  const mockMetricsService = {
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IotDeviceController],
      providers: [
        {
          provide: IotDeviceService,
          useValue: mockIotDeviceService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<IotDeviceController>(IotDeviceController);
    service = module.get<IotDeviceService>(IotDeviceService);
    metrics = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new device', async () => {
      const createDto: CreateIotDeviceDto = {
        name: 'Test Device',
        deviceId: 'DEVICE123',
        type: DeviceType.SENSOR,
        location: 'Warehouse A',
        zone: 'Zone 1',
        firmwareVersion: '1.0.0',
        metadata: {
          manufacturer: 'Test Corp',
          model: 'TS-100',
        },
      };

      mockIotDeviceService.create.mockResolvedValue(mockDevice);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockDevice);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(metrics.increment).toHaveBeenCalledWith('iot.devices.created');
    });
  });

  describe('findAll', () => {
    it('should return an array of devices', async () => {
      const devices = [mockDevice];
      mockIotDeviceService.findAll.mockResolvedValue(devices);

      const result = await controller.findAll({});

      expect(result).toEqual(devices);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single device', async () => {
      mockIotDeviceService.findOne.mockResolvedValue(mockDevice);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockDevice);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByDeviceId', () => {
    it('should return a device by deviceId', async () => {
      mockIotDeviceService.findByDeviceId.mockResolvedValue(mockDevice);

      const result = await controller.findByDeviceId('DEVICE123');

      expect(result).toEqual(mockDevice);
      expect(service.findByDeviceId).toHaveBeenCalledWith('DEVICE123');
    });
  });

  describe('update', () => {
    it('should update a device', async () => {
      const updateDto: UpdateIotDeviceDto = {
        name: 'Updated Device',
        firmwareVersion: '1.1.0',
      };

      const updatedDevice = { ...mockDevice, ...updateDto };
      mockIotDeviceService.update.mockResolvedValue(updatedDevice);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual(updatedDevice);
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(metrics.increment).toHaveBeenCalledWith('iot.devices.updated');
    });
  });

  describe('remove', () => {
    it('should delete a device', async () => {
      mockIotDeviceService.delete.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(metrics.increment).toHaveBeenCalledWith('iot.devices.deleted');
    });
  });

  describe('updateStatus', () => {
    it('should update device status', async () => {
      const status = DeviceStatus.MAINTENANCE;
      const updatedDevice = { ...mockDevice, status };
      mockIotDeviceService.updateStatus.mockResolvedValue(updatedDevice);

      const result = await controller.updateStatus('1', status);

      expect(result).toEqual(updatedDevice);
      expect(service.updateStatus).toHaveBeenCalledWith('1', status, undefined);
    });

    it('should update device status with error message', async () => {
      const status = DeviceStatus.ERROR;
      const errorMessage = 'Connection lost';
      const updatedDevice = { ...mockDevice, status, errorMessage };
      mockIotDeviceService.updateStatus.mockResolvedValue(updatedDevice);

      const result = await controller.updateStatus('1', status, errorMessage);

      expect(result).toEqual(updatedDevice);
      expect(service.updateStatus).toHaveBeenCalledWith('1', status, errorMessage);
    });
  });

  describe('updateReading', () => {
    it('should update device reading', async () => {
      const reading: DeviceReadingDto = {
        value: 26.5,
        unit: 'C',
      };

      const updatedDevice = {
        ...mockDevice,
        lastReading: {
          timestamp: expect.any(Date),
          ...reading,
        },
      };

      mockIotDeviceService.updateReading.mockResolvedValue(updatedDevice);

      const result = await controller.updateReading('1', reading);

      expect(result).toEqual(updatedDevice);
      expect(service.updateReading).toHaveBeenCalledWith('1', reading);
    });
  });

  describe('scheduleMaintenance', () => {
    it('should schedule maintenance', async () => {
      const schedule: MaintenanceScheduleDto = {
        date: new Date(),
      };

      const updatedDevice = {
        ...mockDevice,
        nextMaintenance: schedule.date,
      };

      mockIotDeviceService.scheduleMaintenance.mockResolvedValue(updatedDevice);

      const result = await controller.scheduleMaintenance('1', schedule);

      expect(result).toEqual(updatedDevice);
      expect(service.scheduleMaintenance).toHaveBeenCalledWith('1', schedule);
    });
  });

  describe('getDevicesByStatus', () => {
    it('should return devices by status', async () => {
      const devices = [mockDevice];
      mockIotDeviceService.getDevicesByStatus.mockResolvedValue(devices);

      const result = await controller.getDevicesByStatus(DeviceStatus.ONLINE);

      expect(result).toEqual(devices);
      expect(service.getDevicesByStatus).toHaveBeenCalledWith(DeviceStatus.ONLINE);
    });
  });

  describe('getDevicesByType', () => {
    it('should return devices by type', async () => {
      const devices = [mockDevice];
      mockIotDeviceService.getDevicesByType.mockResolvedValue(devices);

      const result = await controller.getDevicesByType(DeviceType.SENSOR);

      expect(result).toEqual(devices);
      expect(service.getDevicesByType).toHaveBeenCalledWith(DeviceType.SENSOR);
    });
  });

  describe('getDevicesByLocation', () => {
    it('should return devices by location', async () => {
      const devices = [mockDevice];
      mockIotDeviceService.getDevicesByLocation.mockResolvedValue(devices);

      const result = await controller.getDevicesByLocation('Warehouse A');

      expect(result).toEqual(devices);
      expect(service.getDevicesByLocation).toHaveBeenCalledWith('Warehouse A');
    });
  });
}); 