import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportService } from '../services/report.service';
import { Report } from '../models/report.model';
import { CreateReportDto, ReportType, ReportFormat, ReportStatus, ReportFilterDto } from '../dto/report.dto';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../core/services/logger.service';
import { MetricsService } from '../core/services/metrics.service';
import { NotificationService } from '../services/notification.service';

describe('ReportService', () => {
  let service: ReportService;
  let mockModel: any;
  let mockReport: any;

  beforeEach(async () => {
    mockReport = {
      _id: 'report123',
      type: ReportType.INVENTORY,
      format: ReportFormat.EXCEL,
      status: ReportStatus.PENDING,
      parameters: {},
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
      markAsProcessing: jest.fn(),
      markAsCompleted: jest.fn(),
      markAsFailed: jest.fn(),
    };

    mockModel = jest.fn().mockImplementation((dto) => ({ ...mockReport, ...dto }));
    mockModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockReport]),
    });
    mockModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReport),
    });
    mockModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getModelToken(Report.name),
          useValue: mockModel,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('/tmp/uploads'),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            increment: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new report', async () => {
      const createReportDto: CreateReportDto = {
        type: ReportType.INVENTORY,
        format: ReportFormat.EXCEL,
        parameters: {},
      };

      const result = await service.create(createReportDto);
      expect(result).toMatchObject(createReportDto);
      expect(mockModel).toHaveBeenCalledWith(expect.objectContaining(createReportDto));
    });
  });

  describe('findAll', () => {
    it('should return an array of reports', async () => {
      const filter: ReportFilterDto = {
        type: ReportType.INVENTORY,
        status: ReportStatus.PENDING,
      };

      const result = await service.findAll(filter);
      expect(result).toEqual([mockReport]);
      expect(mockModel.find).toHaveBeenCalledWith(filter);
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      const result = await service.findOne('report123');
      expect(result).toBeDefined();
      expect(mockModel.findById).toHaveBeenCalledWith('report123');
    });
  });

  describe('delete', () => {
    it('should delete a report', async () => {
      await service.delete('report123');
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: 'report123' });
    });
  });

  describe('download', () => {
    it('should return file info for completed report', async () => {
      const completedReport = {
        ...mockReport,
        status: ReportStatus.COMPLETED,
        fileUrl: '/uploads/test.xlsx',
        fileSize: 1024,
      };

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(completedReport),
      });

      const result = await service.download('report123');
      expect(result).toEqual({
        fileUrl: completedReport.fileUrl,
        fileSize: completedReport.fileSize,
      });
    });

    it('should throw error for non-completed report', async () => {
      await expect(service.download('report123')).rejects.toThrow('Report is not completed');
    });
  });

  describe('getAvailableTypes', () => {
    it('should return available report types', async () => {
      const result = await service.getAvailableTypes();
      expect(result).toEqual(Object.values(ReportType));
    });
  });

  describe('getAvailableFormats', () => {
    it('should return available report formats', async () => {
      const result = await service.getAvailableFormats();
      expect(result).toEqual(Object.values(ReportFormat));
    });
  });
}); 