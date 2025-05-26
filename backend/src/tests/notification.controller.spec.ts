import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/notification.model';
import { CreateNotificationDto, UpdateNotificationDto, NotificationStatus, NotificationType } from '../dto/notification.dto';
import { MetricsService } from '../core/services/metrics.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotification: Partial<Notification> = {
    _id: 'test-id',
    type: NotificationType.EMAIL,
    recipient: 'test@example.com',
    subject: 'Test Subject',
    content: 'Test Content',
    status: NotificationStatus.PENDING,
    retryCount: 0,
    markAsSent: jest.fn(),
    markAsFailed: jest.fn(),
  };

  const mockNotificationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFailed: jest.fn(),
    retryFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: MetricsService,
          useValue: { increment: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createDto: CreateNotificationDto = {
        type: NotificationType.EMAIL,
        recipient: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
      };

      mockNotificationService.create.mockResolvedValue(mockNotification);

      const result = await controller.create(createDto);
      expect(result).toEqual(mockNotification);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of notifications', async () => {
      mockNotificationService.findAll.mockResolvedValue([mockNotification]);

      const result = await controller.findAll({} as any);
      expect(result).toEqual([mockNotification]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findFailed', () => {
    it('should return an array of failed notifications', async () => {
      const failedNotification = {
        ...mockNotification,
        status: NotificationStatus.FAILED,
      };
      mockNotificationService.findFailed.mockResolvedValue([failedNotification]);

      const result = await controller.findFailed();
      expect(result).toEqual([failedNotification]);
      expect(service.findFailed).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      mockNotificationService.findOne.mockResolvedValue(mockNotification);

      const result = await controller.findOne('test-id');
      expect(result).toEqual(mockNotification);
      expect(service.findOne).toHaveBeenCalledWith('test-id');
    });
  });

  describe('update', () => {
    it('should update a notification', async () => {
      const updateDto: UpdateNotificationDto = {
        // content: 'Updated Content',
      };

      const updatedNotification = {
        ...mockNotification,
        ...updateDto,
      };

      mockNotificationService.update.mockResolvedValue(updatedNotification);

      const result = await controller.update('test-id', updateDto);
      expect(result).toEqual(updatedNotification);
      expect(service.update).toHaveBeenCalledWith('test-id', updateDto);
    });
  });

  describe('retryFailed', () => {
    it('should retry a failed notification', async () => {
      const retriedNotification = {
        ...mockNotification,
        status: NotificationStatus.PENDING,
        retryCount: 1,
      };

      mockNotificationService.retryFailed.mockResolvedValue(retriedNotification);

      const result = await controller.retryFailed('test-id');
      expect(result).toEqual(retriedNotification);
      expect(service.retryFailed).toHaveBeenCalledWith('test-id');
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      mockNotificationService.delete.mockResolvedValue(undefined);

      await controller.remove('test-id');
      expect(service.delete).toHaveBeenCalledWith('test-id');
    });
  });
}); 