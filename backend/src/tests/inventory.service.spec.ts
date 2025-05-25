import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryService } from '../services/inventory.service';
import { Product } from '../models/product.model';
import { LoggerService } from '../core/services/logger.service';
import { CacheService } from '../core/services/cache.service';
import { MetricsService } from '../core/services/metrics.service';
import { CreateProductDto, UpdateProductDto, StockUpdateDto } from '../dto/product.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let model: Model<Product>;
  let logger: LoggerService;
  let cache: CacheService;
  let metrics: MetricsService;

  const mockProduct = {
    sku: 'TEST-001',
    name: 'Test Product',
    description: 'Test Description',
    category: 'Test Category',
    zone: 'A1',
    currentStock: 10,
    minStock: 5,
    maxStock: 20,
    metadata: {},
    status: 'active',
    save: jest.fn(),
  };

  const mockModel = {
    new: jest.fn().mockResolvedValue(mockProduct),
    constructor: jest.fn().mockResolvedValue(mockProduct),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    findLowStock: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    flush: jest.fn(),
  };

  const mockMetrics = {
    incrementCounter: jest.fn(),
    observeHistogram: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getModelToken(Product.name),
          useValue: mockModel,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: MetricsService,
          useValue: mockMetrics,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    model = module.get<Model<Product>>(getModelToken(Product.name));
    logger = module.get<LoggerService>(LoggerService);
    cache = module.get<CacheService>(CacheService);
    metrics = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Test Description',
        category: 'Test Category',
        zone: 'A1',
        currentStock: 10,
        minStock: 5,
        maxStock: 20,
      };

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockModel.new).toHaveBeenCalledWith(createProductDto);
      expect(mockProduct.save).toHaveBeenCalled();
      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith(
        'inventory_operations_total',
        { operation: 'create', status: 'success' }
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const mockProducts = [mockProduct];
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockProducts),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockProducts);
      expect(mockModel.find).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached products if available', async () => {
      const mockProducts = [mockProduct];
      mockCache.get.mockResolvedValueOnce(mockProducts);

      const result = await service.findAll();

      expect(result).toEqual(mockProducts);
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockModel.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by SKU', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockProduct),
      });

      const result = await service.findOne('TEST-001');

      expect(result).toEqual(mockProduct);
      expect(mockModel.findOne).toHaveBeenCalledWith({ sku: 'TEST-001' });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(service.findOne('TEST-001')).rejects.toThrow();
    });
  });

  describe('updateStock', () => {
    it('should update stock when adding', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockProduct),
      });

      const stockUpdateDto: StockUpdateDto = {
        quantity: 5,
        type: 'add',
      };

      const result = await service.updateStock('TEST-001', stockUpdateDto);

      expect(result.currentStock).toBe(15);
      expect(mockProduct.save).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should update stock when removing', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockProduct),
      });

      const stockUpdateDto: StockUpdateDto = {
        quantity: 3,
        type: 'remove',
      };

      const result = await service.updateStock('TEST-001', stockUpdateDto);

      expect(result.currentStock).toBe(7);
      expect(mockProduct.save).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when removing more than available stock', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockProduct),
      });

      const stockUpdateDto: StockUpdateDto = {
        quantity: 15,
        type: 'remove',
      };

      await expect(service.updateStock('TEST-001', stockUpdateDto)).rejects.toThrow();
    });
  });
}); 