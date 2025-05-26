import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from '../controllers/report.controller';
import { ReportService } from '../services/report.service';
import { MetricsService } from '../core/services/metrics.service';
import { CreateReportDto, ReportFilterDto, ReportType, ReportFormat, ReportStatus } from '../dto/report.dto';
import { Report } from '../models/report.model';
import { Response } from 'express';

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;
  let metrics: MetricsService;

  const mockReport: Partial<Report> = {
    id: '1',
    type: ReportType.INVENTORY,
    format: ReportFormat.EXCEL,
    status: ReportStatus.COMPLETED,
    fileUrl: '/reports/1.xlsx',
    fileSize: 1024,
    metadata: {},
  };

  const mockReportService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
  };

  const mockMetricsService = {
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
    metrics = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a report', async () => {
      const createDto: CreateReportDto = {
        type: ReportType.INVENTORY,
        format: ReportFormat.EXCEL,
        parameters: {},
      };

      mockReportService.create.mockResolvedValue(mockReport);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockReport);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(metrics.increment).toHaveBeenCalledWith('reports.created');
    });
  });

  describe('findAll', () => {
    it('should return an array of reports', async () => {
      const filter: ReportFilterDto = {};
      mockReportService.findAll.mockResolvedValue([mockReport]);

      const result = await controller.findAll(filter);

      expect(result).toEqual([mockReport]);
      expect(service.findAll).toHaveBeenCalledWith(filter);
    });
  });

  describe('getTypes', () => {
    it('should return available report types', async () => {
      const result = await controller.getTypes();

      expect(result).toEqual(['inventory', 'sales', 'users', 'notifications']);
    });
  });

  describe('getFormats', () => {
    it('should return available report formats', async () => {
      const result = await controller.getFormats();

      expect(result).toEqual(['excel', 'pdf', 'csv']);
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      mockReportService.findOne.mockResolvedValue(mockReport);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockReport);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('download', () => {
    it('should download a report file', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      } as unknown as Response;

      const downloadResult = {
        fileUrl: '/reports/1.xlsx',
        fileSize: 1024,
      };

      mockReportService.download.mockResolvedValue(downloadResult);

      await controller.download('1', mockResponse);

      expect(service.download).toHaveBeenCalledWith('1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=1.xlsx');
      expect(mockResponse.sendFile).toHaveBeenCalledWith('/reports/1.xlsx');
      expect(metrics.increment).toHaveBeenCalledWith('reports.downloaded');
    });
  });

  describe('remove', () => {
    it('should delete a report', async () => {
      await controller.remove('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(metrics.increment).toHaveBeenCalledWith('reports.deleted');
    });
  });
}); 