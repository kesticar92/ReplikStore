import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/notification.model';
import { CreateNotificationDto, NotificationType, NotificationStatus } from '../dto/notification.dto';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../core/services/logger.service';
import { MetricsService } from '../core/services/metrics.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockModel: any;

  let mockNotification: any;

  beforeEach(async () => {
    mockNotification = {
      _id: 'notification123',
      type: NotificationType.EMAIL,
      recipient: 'test@example.com',
      subject: 'Test Subject',
      content: 'Test Content',
      status: NotificationStatus.PENDING,
      retryCount: 0,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
      markAsSent: jest.fn(),
      markAsFailed: jest.fn(),
    };

    mockModel = jest.fn().mockImplementation((dto) => ({ ...mockNotification, ...dto }));
    mockModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockNotification]),
    });
    mockModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockNotification),
    });
    mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockNotification),
    });
    mockModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockModel,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string | number | boolean> = {
                'email.host': 'smtp.example.com',
                'email.port': 587,
                'email.secure': false,
                'email.auth.user': 'test@example.com',
                'email.auth.pass': 'password',
                'sms.accountSid': 'AC1234567890abcdef1234567890abcdef',
                'sms.authToken': 'test-token',
                'sms.from': '+1234567890',
              };
              return config[key];
            }),
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
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const createNotificationDto: CreateNotificationDto = {
        type: NotificationType.EMAIL,
        recipient: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
      };

      const result = await service.create(createNotificationDto);
      expect(result).toMatchObject(createNotificationDto);
      expect(mockModel).toHaveBeenCalledWith(expect.objectContaining(createNotificationDto));
    });
  });

  describe('findAll', () => {
    it('should return an array of notifications', async () => {
      const result = await service.findAll({});
      expect(result).toEqual([mockNotification]);
      expect(mockModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      const result = await service.findOne('notification123');
      expect(result).toBeDefined();
      expect(mockModel.findById).toHaveBeenCalledWith('notification123');
    });
  });

  describe('update', () => {
    it('should update a notification', async () => {
      const updateData = {
        subject: 'Updated Subject',
        content: 'Updated Content',
      };

      const result = await service.update('notification123', updateData);
      expect(result).toBeDefined();
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('notification123', updateData, { new: true });
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      await service.delete('notification123');
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: 'notification123' });
    });
  });

  describe('findFailed', () => {
    it('should return failed notifications', async () => {
      const failedNotification = {
        ...mockNotification,
        status: NotificationStatus.FAILED,
      };

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([failedNotification]),
      });

      const result = await service.findFailed();
      expect(result).toEqual([failedNotification]);
      expect(mockModel.find).toHaveBeenCalledWith({ status: NotificationStatus.FAILED });
    });
  });

  describe('retryFailed', () => {
    it('should retry a failed notification', async () => {
      const failedNotification = {
        ...mockNotification,
        status: NotificationStatus.FAILED,
        retryCount: 0,
        markAsSent: jest.fn(),
        markAsFailed: jest.fn(),
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(failedNotification),
      });

      const result = await service.retryFailed('notification123');
      expect(result.status).toBe(NotificationStatus.PENDING);
      expect(result.retryCount).toBe(1);
    });

    it('should not retry a non-failed notification', async () => {
      mockNotification.status = NotificationStatus.PENDING;
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockNotification),
      });
      await expect(service.retryFailed('notification123')).rejects.toThrow('Only failed notifications can be retried');
    });
  });
}); 