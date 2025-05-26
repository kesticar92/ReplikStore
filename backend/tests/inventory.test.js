const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');
const chai = require('chai');
const sinon = require('sinon');
const inventoryService = require('../services/inventoryService');
const Product = require('../models/product');
const eventEmitter = require('../utils/eventEmitter');
const { ValidationError } = require('../utils/errors');
const Inventory = require('../models/inventory');
const User = require('../models/user');

// Limpiar caché de require para evitar conflictos de modelo
Object.keys(require.cache).forEach((key) => {
    if (key.includes('/models/')) {
        delete require.cache[key];
    }
});

// Mock para el modelo de producto que acepta new
class ProductModelMock {
  constructor(data) {
    Object.assign(this, data);
    this.save = sinon.stub().resolves(this);
  }
  static find = sinon.stub();
  static findOne = sinon.stub();
  static findOneAndUpdate = sinon.stub();
  static deleteOne = sinon.stub();
  static create = sinon.stub();
}

// Reemplazar el modelo real por el mock
const originalProduct = require('../models/product');
require('../models/product').__proto__ = ProductModelMock.prototype;

// Mock de cache para evitar conexión real a Redis
describe('Sistema de Inventario', () => {
    let app;
    let mongoServer;
    let token;
    let testProduct;

    before(async () => {
        // Mockear el módulo de cache antes de requerir la app
        require.cache[require.resolve('../utils/cache.js')] = {
            exports: {
                cacheMiddleware: () => (req, res, next) => next(),
                Cache: class { get() {}; set() {}; del() {}; flush() {} },
                invalidateCache: () => {}
            }
        };

        // Crear una instancia de MongoDB en memoria
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Cerrar cualquier conexión existente
        await mongoose.disconnect();

        // Conectar a la base de datos en memoria
        await mongoose.connect(mongoUri);

        const appModule = require('../app');
        app = appModule.app;
    });

    after(async () => {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
        }

        token = jwt.sign(
            { userId: 'test', role: 'admin', email: 'test@example.com' },
            process.env.JWT_SECRET || 'test-secret-key'
        );
        
        // Usar el mock en lugar del modelo real
        testProduct = new ProductModelMock({
            name: 'Test Product',
            sku: 'TEST001',
            currentStock: 100,
            minStock: 10,
            maxStock: 200,
            reorderPoint: 20,
            zone: 'A1',
            price: 99.99,
            category: 'Test',
            status: 'active'
        });
        await testProduct.save();
    });

    afterEach(async () => {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
        }
    });

    describe('GET /api/inventory', () => {
        it('debe obtener todos los productos', async () => {
            const res = await request(app)
                .get('/api/inventory')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.greaterThan(0);
            expect(res.body.data[0]).to.have.property('sku', testProduct.sku);
        });

        it('debe manejar error de autenticación', async () => {
            const res = await request(app)
                .get('/api/inventory');

            expect(res.statusCode).to.equal(401);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.equal('Token inválido o expirado');
        });
    });

    describe('GET /api/inventory/:sku', () => {
        it('debe obtener un producto por SKU', async () => {
            const res = await request(app)
                .get(`/api/inventory/${testProduct.sku}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.deep.include({
                sku: testProduct.sku,
                name: testProduct.name,
                currentStock: testProduct.currentStock
            });
        });

        it('debe manejar SKU no existente', async () => {
            const res = await request(app)
                .get('/api/inventory/NONEXISTENT')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).to.equal(404);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.equal('Producto no encontrado');
        });
    });

    describe('POST /api/inventory', () => {
        it('debe crear un nuevo producto', async () => {
            const newProduct = {
                name: 'New Product',
                sku: 'NEW001',
                currentStock: 50,
                minStock: 5,
                maxStock: 100,
                reorderPoint: 10,
                zone: 'B1',
                price: 49.99,
                category: 'New',
                status: 'active'
            };

            const res = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${token}`)
                .send(newProduct);

            expect(res.statusCode).to.equal(201);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.deep.include(newProduct);
        });

        it('debe validar campos requeridos', async () => {
            const res = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.statusCode).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.errors).to.be.an('array');
            expect(res.body.errors.length).to.be.greaterThan(0);
        });

        it('debe validar SKU único', async () => {
            const res = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...testProduct.toObject(),
                    _id: undefined
                });

            expect(res.statusCode).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('SKU duplicado');
        });
    });

    describe('PUT /api/inventory/:sku/stock', () => {
        it('debe actualizar el stock de un producto', async () => {
            const update = {
                quantity: -10,
                type: 'sale'
            };

            const res = await request(app)
                .put(`/api/inventory/${testProduct.sku}/stock`)
                .set('Authorization', `Bearer ${token}`)
                .send(update);

            expect(res.statusCode).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data.currentStock).to.equal(90);
        });

        it('debe manejar actualización inválida', async () => {
            const res = await request(app)
                .put(`/api/inventory/${testProduct.sku}/stock`)
                .set('Authorization', `Bearer ${token}`)
                .send({ quantity: 'invalid' });

            expect(res.statusCode).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.errors).to.be.an('array');
        });

        it('debe prevenir stock negativo', async () => {
            const update = {
                quantity: -200,
                type: 'sale'
            };

            const res = await request(app)
                .put(`/api/inventory/${testProduct.sku}/stock`)
                .set('Authorization', `Bearer ${token}`)
                .send(update);

            expect(res.statusCode).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('stock insuficiente');
        });
    });

    describe('GET /api/inventory/reorder-needed', () => {
        it('debe obtener productos que necesitan reorden', async () => {
            await Product.create({
                name: 'Low Stock Product',
                sku: 'LOW001',
                currentStock: 5,
                minStock: 10,
                maxStock: 100,
                reorderPoint: 20,
                zone: 'A2',
                price: 29.99,
                category: 'Test',
                status: 'active'
            });

            const res = await request(app)
                .get('/api/inventory/reorder-needed')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.be.greaterThan(0);
            expect(res.body.data[0].sku).to.equal('LOW001');
        });
    });

    describe('GET /api/inventory/zone/:zone', () => {
        it('debe obtener inventario por zona', async () => {
            const res = await request(app)
                .get('/api/inventory/zone/A1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data.zone).to.equal('A1');
            expect(res.body.data.products).to.be.an('array');
            expect(res.body.data.products.length).to.be.greaterThan(0);
            expect(res.body.data.products[0].sku).to.equal(testProduct.sku);
        });

        it('debe manejar zona no existente', async () => {
            const res = await request(app)
                .get('/api/inventory/zone/NONEXISTENT')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data.products).to.be.an('array');
            expect(res.body.data.products.length).to.equal(0);
        });
    });
});

describe('InventoryService', () => {
    let eventEmitterStub;

    beforeEach(() => {
        // Crear stubs para las dependencias
        eventEmitterStub = {
            emitLowStock: sinon.stub(),
            emitStockUpdated: sinon.stub(),
            emitProductCreated: sinon.stub(),
            emitProductUpdated: sinon.stub(),
            emitProductDeleted: sinon.stub()
        };
        sinon.stub(eventEmitter, 'emitLowStock').callsFake(eventEmitterStub.emitLowStock);
        sinon.stub(eventEmitter, 'emitStockUpdated').callsFake(eventEmitterStub.emitStockUpdated);
        sinon.stub(eventEmitter, 'emitProductCreated').callsFake(eventEmitterStub.emitProductCreated);
        sinon.stub(eventEmitter, 'emitProductUpdated').callsFake(eventEmitterStub.emitProductUpdated);
        sinon.stub(eventEmitter, 'emitProductDeleted').callsFake(eventEmitterStub.emitProductDeleted);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('getAllProducts', () => {
        it('debería obtener todos los productos con paginación', async () => {
            const mockProducts = [
                { sku: 'TEST-001', name: 'Product 1' },
                { sku: 'TEST-002', name: 'Product 2' }
            ];
            sinon.stub(Product, 'find').returns({
                sort: sinon.stub().returns({
                    skip: sinon.stub().returns({
                        limit: sinon.stub().resolves(mockProducts)
                    })
                })
            });
            sinon.stub(Product, 'countDocuments').resolves(2);

            const result = await inventoryService.getAllProducts({
                page: 1,
                limit: 10,
                sortBy: 'name',
                sortOrder: 'asc'
            });

            expect(result.products).to.deep.equal(mockProducts);
            expect(result.pagination).to.deep.include({
                total: 2,
                page: 1,
                limit: 10
            });
        });

        it('debería filtrar productos por categoría', async () => {
            const mockProducts = [{ sku: 'TEST-001', name: 'Product 1', category: 'Test' }];
            sinon.stub(Product, 'find').returns({
                sort: sinon.stub().returns({
                    skip: sinon.stub().returns({
                        limit: sinon.stub().resolves(mockProducts)
                    })
                })
            });
            sinon.stub(Product, 'countDocuments').resolves(1);

            const result = await inventoryService.getAllProducts({
                category: 'Test'
            });

            expect(result.products).to.deep.equal(mockProducts);
            expect(Product.find.firstCall.args[0]).to.deep.include({
                category: 'Test'
            });
        });
    });

    describe('getProductBySKU', () => {
        it('debería obtener un producto por SKU', async () => {
            const mockProduct = { sku: 'TEST-001', name: 'Test Product' };
            sinon.stub(Product, 'findOne').resolves(mockProduct);

            const result = await inventoryService.getProductBySKU('TEST-001');

            expect(result).to.deep.equal(mockProduct);
            expect(Product.findOne.calledWith({ sku: 'TEST-001' })).to.be.true;
        });

        it('debería lanzar error si el SKU es inválido', async () => {
            try {
                await inventoryService.getProductBySKU();
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
            }
        });
    });

    describe('createProduct', () => {
        const mockProduct = {
            sku: 'TEST-001',
            name: 'Test Product',
            description: 'Test Description',
            category: 'Test Category',
            price: 99.99,
            cost: 50.00,
            minStock: 10,
            maxStock: 100,
            reorderPoint: 20,
            zone: 'A1'
        };

        it('debería crear un producto correctamente', async () => {
            sinon.stub(Product, 'findOne').resolves(null);
            sinon.stub(Product.prototype, 'save').resolves(mockProduct);

            const result = await inventoryService.createProduct(mockProduct);

            expect(result).to.deep.equal(mockProduct);
            expect(eventEmitter.emitProductCreated.calledOnce).to.be.true;
        });

        it('debería lanzar error si el SKU ya existe', async () => {
            sinon.stub(Product, 'findOne').resolves(mockProduct);

            try {
                await inventoryService.createProduct(mockProduct);
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
                expect(error.message).to.include('SKU duplicado');
            }
        });
    });
}); 