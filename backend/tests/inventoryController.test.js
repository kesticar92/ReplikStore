const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const mongoose = require('mongoose');
const InventoryController = require('../controllers/inventoryController');
const Inventory = require('../models/inventory');
const Product = require('../models/product');
const User = require('../models/user');
const { NotFoundError, ValidationError } = require('../utils/errors');

describe('Inventory Controller', () => {
    let sandbox;
    let mockProduct;
    let mockUser;
    let mockInventory;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        
        // Crear producto de prueba
        mockProduct = await Product.create({
            name: 'Producto Test',
            sku: 'TEST123',
            price: 99.99,
            currentStock: 100,
            minStock: 10,
            maxStock: 200,
            reorderPoint: 20,
            category: 'Test',
            zone: 'ZONA-A'
        });

        // Crear usuario de prueba
        mockUser = await User.create({
            name: 'Usuario Test',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin'
        });

        // Crear movimiento de inventario de prueba
        mockInventory = await Inventory.create({
            product: mockProduct._id,
            quantity: 10,
            type: 'in',
            reference: 'REF-001',
            location: 'ZONA-A',
            operator: mockUser._id,
            status: 'completed'
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('list', () => {
        it('debería listar movimientos con paginación', async () => {
            const req = {
                query: {
                    page: 1,
                    limit: 10
                }
            };
            const res = {
                json: sinon.spy()
            };

            await InventoryController.list(req, res);

            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response).to.have.property('movements');
            expect(response).to.have.property('total');
            expect(response).to.have.property('page');
            expect(response).to.have.property('limit');
        });

        it('debería filtrar movimientos por producto', async () => {
            const req = {
                query: {
                    product: mockProduct._id.toString()
                }
            };
            const res = {
                json: sinon.spy()
            };

            await InventoryController.list(req, res);

            const response = res.json.firstCall.args[0];
            expect(response.movements).to.have.lengthOf(1);
            expect(response.movements[0].product._id.toString()).to.equal(mockProduct._id.toString());
        });
    });

    describe('get', () => {
        it('debería obtener un movimiento por ID', async () => {
            const req = {
                params: {
                    id: mockInventory._id.toString()
                }
            };
            const res = {
                json: sinon.spy()
            };

            await InventoryController.get(req, res);

            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response._id.toString()).to.equal(mockInventory._id.toString());
        });

        it('debería lanzar error si el movimiento no existe', async () => {
            const req = {
                params: {
                    id: new mongoose.Types.ObjectId().toString()
                }
            };
            const res = {
                json: sinon.spy()
            };

            try {
                await InventoryController.get(req, res);
                expect.fail('Debería haber fallado');
            } catch (error) {
                expect(error).to.be.instanceOf(NotFoundError);
            }
        });
    });

    describe('create', () => {
        it('debería crear un nuevo movimiento', async () => {
            const req = {
                body: {
                    product: mockProduct._id.toString(),
                    quantity: 5,
                    type: 'in',
                    reference: 'REF-002',
                    location: 'ZONA-A',
                    operator: mockUser._id.toString()
                }
            };
            const res = {
                json: sinon.spy()
            };

            await InventoryController.create(req, res);

            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response.product.toString()).to.equal(mockProduct._id.toString());
            expect(response.quantity).to.equal(5);
            expect(response.type).to.equal('in');
        });

        it('debería lanzar error si el producto no existe', async () => {
            const req = {
                body: {
                    product: new mongoose.Types.ObjectId().toString(),
                    quantity: 5,
                    type: 'in',
                    reference: 'REF-002',
                    location: 'ZONA-A',
                    operator: mockUser._id.toString()
                }
            };
            const res = {
                json: sinon.spy()
            };

            try {
                await InventoryController.create(req, res);
                expect.fail('Debería haber fallado');
            } catch (error) {
                expect(error).to.be.instanceOf(NotFoundError);
            }
        });

        it('debería lanzar error si no hay stock suficiente para salida', async () => {
            const req = {
                body: {
                    product: mockProduct._id.toString(),
                    quantity: 200,
                    type: 'out',
                    reference: 'REF-002',
                    location: 'ZONA-A',
                    operator: mockUser._id.toString()
                }
            };
            const res = {
                json: sinon.spy()
            };

            try {
                await InventoryController.create(req, res);
                expect.fail('Debería haber fallado');
            } catch (error) {
                expect(error).to.be.instanceOf(ValidationError);
            }
        });
    });

    describe('update', () => {
        it('debería actualizar un movimiento', async () => {
            const req = {
                params: {
                    id: mockInventory._id.toString()
                },
                body: {
                    notes: 'Notas actualizadas',
                    status: 'cancelled'
                }
            };
            const res = {
                json: sinon.spy()
            };

            await InventoryController.update(req, res);

            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response.notes).to.equal('Notas actualizadas');
            expect(response.status).to.equal('cancelled');
        });

        it('debería lanzar error si el movimiento no existe', async () => {
            const req = {
                params: {
                    id: new mongoose.Types.ObjectId().toString()
                },
                body: {
                    notes: 'Notas actualizadas'
                }
            };
            const res = {
                json: sinon.spy()
            };

            try {
                await InventoryController.update(req, res);
                expect.fail('Debería haber fallado');
            } catch (error) {
                expect(error).to.be.instanceOf(NotFoundError);
            }
        });
    });

    describe('getProductMovements', () => {
        it('debería obtener movimientos por producto', async () => {
            const req = {
                params: {
                    productId: mockProduct._id.toString()
                },
                query: {
                    page: 1,
                    limit: 10
                }
            };
            const res = {
                json: sinon.spy()
            };

            await InventoryController.getProductMovements(req, res);

            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response).to.have.property('movements');
            expect(response).to.have.property('total');
            expect(response.movements[0].product._id.toString()).to.equal(mockProduct._id.toString());
        });
    });

    describe('getLocationMovements', () => {
        it('debería obtener movimientos por ubicación', async () => {
            const req = {
                params: {
                    location: 'ZONA-A'
                },
                query: {
                    page: 1,
                    limit: 10
                }
            };
            const res = {
                json: sinon.spy()
            };

            await InventoryController.getLocationMovements(req, res);

            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response).to.have.property('movements');
            expect(response).to.have.property('total');
            expect(response.movements[0].location).to.equal('ZONA-A');
        });
    });
}); 