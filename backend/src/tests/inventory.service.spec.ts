import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryService } from '../services/inventory.service';
import { Product } from '../models/product.model';
import { CreateProductDto, UpdateProductDto, StockUpdateDto } from '../dto/product.dto';
import { LoggerService } from '../core/services/logger.service';
import { MetricsService } from '../core/services/metrics.service';
import { CacheService } from '../core/services/cache.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockModel: any;
  let mockCache: any;

  let mockProduct: any;

  beforeEach(async () => {
    mockProduct = {
      _id: 'product123',
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      stock: 10,
      category: 'Test Category',
      zone: 'Test Zone',
      currentStock: 10,
      minStock: 5,
      maxStock: 20,
      sku: 'TEST-SKU-001',
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };

    mockModel = jest.fn().mockImplementation((dto) => ({ ...mockProduct, ...dto }));
    mockModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockProduct]),
    });
    mockModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProduct),
    });
    mockModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProduct),
    });
    mockModel.findOneAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProduct),
    });
    mockModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getModelToken(Product.name),
          useValue: mockModel,
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: MetricsService,
          useValue: {
            increment: jest.fn(),
            incrementCounter: jest.fn(),
            observeHistogram: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        stock: 10,
        category: 'Test Category',
        zone: 'Test Zone',
        currentStock: 10,
        minStock: 5,
        maxStock: 20,
        sku: 'TEST-SKU-001',
      };

      const result = await service.create(createProductDto);
      expect(result).toMatchObject(createProductDto);
      expect(mockModel).toHaveBeenCalledWith(expect.objectContaining(createProductDto));
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockProduct]);
      expect(mockModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await service.findOne('product123');
      expect(result).toBeDefined();
      expect(mockModel.findOne).toHaveBeenCalledWith({ sku: 'product123' });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 200,
        stock: 20,
        category: 'Updated Category',
        zone: 'Updated Zone',
        currentStock: 20,
        minStock: 10,
        maxStock: 30,
        sku: 'TEST-SKU-001',
      };

      const result = await service.update('product123', updateProductDto);
      expect(result).toBeDefined();
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { sku: 'product123' },
        updateProductDto,
        { new: true }
      );
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      await service.delete('product123');
      expect(mockModel.deleteOne).toHaveBeenCalledWith({ sku: 'product123' });
    });
  });

  describe('updateStock', () => {
    it('should add stock to a product', async () => {
      mockProduct.currentStock = 10;
      const stockUpdateDto: StockUpdateDto = {
        quantity: 5,
        operation: 'add',
      };
      const result = await service.updateStock('product123', stockUpdateDto);
      expect(result.currentStock).toBe(15);
    });

    it('should remove stock from a product', async () => {
      mockProduct.currentStock = 10;
      const stockUpdateDto: StockUpdateDto = {
        quantity: 5,
        operation: 'subtract',
      };
      const result = await service.updateStock('product123', stockUpdateDto);
      expect(result.currentStock).toBe(5);
    });

    it('should not allow negative stock', async () => {
      mockProduct.currentStock = 10;
      const stockUpdateDto: StockUpdateDto = {
        quantity: 15,
        operation: 'subtract',
      };
      await expect(service.updateStock('product123', stockUpdateDto)).rejects.toThrow('Insufficient stock');
    });
  });
}); 