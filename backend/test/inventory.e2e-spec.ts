import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateProductDto, StockUpdateDto } from '../src/dto/product.dto';

describe('InventoryController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Obtener token de autenticación
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test',
        password: 'test123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  const testProduct: CreateProductDto = {
    sku: 'TEST-001',
    name: 'Test Product',
    description: 'Test Description',
    category: 'Test Category',
    zone: 'A1',
    currentStock: 10,
    minStock: 5,
    maxStock: 20,
  };

  describe('/inventory (POST)', () => {
    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sku', testProduct.sku);
          expect(res.body).toHaveProperty('name', testProduct.name);
        });
    });

    it('should not create a product with duplicate SKU', () => {
      return request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(400);
    });
  });

  describe('/inventory (GET)', () => {
    it('should return all products', () => {
      return request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/inventory/low-stock (GET)', () => {
    it('should return products with low stock', () => {
      return request(app.getHttpServer())
        .get('/inventory/low-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
        });
    });
  });

  describe('/inventory/:sku (GET)', () => {
    it('should return a product by SKU', () => {
      return request(app.getHttpServer())
        .get(`/inventory/${testProduct.sku}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sku', testProduct.sku);
        });
    });

    it('should return 404 for non-existent SKU', () => {
      return request(app.getHttpServer())
        .get('/inventory/NON-EXISTENT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/inventory/:sku/stock (PUT)', () => {
    const stockUpdate: StockUpdateDto = {
      quantity: 5,
      type: 'add',
    };

    it('should update product stock', () => {
      return request(app.getHttpServer())
        .put(`/inventory/${testProduct.sku}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('currentStock', testProduct.currentStock + stockUpdate.quantity);
        });
    });

    it('should not allow removing more stock than available', () => {
      const invalidUpdate: StockUpdateDto = {
        quantity: 1000,
        type: 'remove',
      };

      return request(app.getHttpServer())
        .put(`/inventory/${testProduct.sku}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });

  describe('/inventory/:sku (DELETE)', () => {
    it('should delete a product', () => {
      return request(app.getHttpServer())
        .delete(`/inventory/${testProduct.sku}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 when deleting non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/inventory/NON-EXISTENT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 