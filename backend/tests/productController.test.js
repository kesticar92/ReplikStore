const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const Product = require('../models/product');
const productController = require('../controllers/productController');
const { NotFoundError, ValidationError } = require('../utils/errors');

describe('Product Controller', () => {
    let sandbox;
    let req;
    let res;
    let next;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        req = {
            params: {},
            query: {},
            body: {}
        };
        res = {
            json: sandbox.stub(),
            status: sandbox.stub().returnsThis()
        };
        next = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('list', () => {
        it('debería listar productos con paginación', async () => {
            const mockProducts = [
                { _id: '1', name: 'Producto 1' },
                { _id: '2', name: 'Producto 2' }
            ];

            sandbox.stub(Product, 'find').returns({
                skip: sandbox.stub().returnsThis(),
                limit: sandbox.stub().returnsThis(),
                sort: sandbox.stub().resolves(mockProducts)
            });

            sandbox.stub(Product, 'countDocuments').resolves(2);

            req.query = { page: 1, limit: 10 };

            await productController.list(req, res, next);

            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.deep.include({
                success: true,
                data: {
                    products: mockProducts,
                    total: 2,
                    page: 1,
                    pages: 1
                }
            });
        });

        it('debería filtrar por categoría', async () => {
            const mockProducts = [{ _id: '1', name: 'Producto 1', category: 'Test' }];

            sandbox.stub(Product, 'find').returns({
                skip: sandbox.stub().returnsThis(),
                limit: sandbox.stub().returnsThis(),
                sort: sandbox.stub().resolves(mockProducts)
            });

            sandbox.stub(Product, 'countDocuments').resolves(1);

            req.query = { category: 'Test' };

            await productController.list(req, res, next);

            expect(Product.find.calledWith({ category: 'Test' })).to.be.true;
        });

        it('debería buscar por nombre o SKU', async () => {
            const mockProducts = [{ _id: '1', name: 'Producto Test', sku: 'TEST123' }];

            sandbox.stub(Product, 'find').returns({
                skip: sandbox.stub().returnsThis(),
                limit: sandbox.stub().returnsThis(),
                sort: sandbox.stub().resolves(mockProducts)
            });

            sandbox.stub(Product, 'countDocuments').resolves(1);

            req.query = { search: 'Test' };

            await productController.list(req, res, next);

            expect(Product.find.calledWith({
                $or: [
                    { name: { $regex: 'Test', $options: 'i' } },
                    { sku: { $regex: 'Test', $options: 'i' } }
                ]
            })).to.be.true;
        });
    });

    describe('get', () => {
        it('debería obtener un producto por ID', async () => {
            const mockProduct = {
                _id: '1',
                name: 'Producto Test',
                sku: 'TEST123'
            };

            sandbox.stub(Product, 'findById').resolves(mockProduct);

            req.params.id = '1';

            await productController.get(req, res, next);

            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.deep.include({
                success: true,
                data: mockProduct
            });
        });

        it('debería manejar producto no encontrado', async () => {
            sandbox.stub(Product, 'findById').resolves(null);

            req.params.id = '1';

            await productController.get(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
        });
    });

    describe('create', () => {
        it('debería crear un nuevo producto', async () => {
            const productData = {
                name: 'Producto Test',
                sku: 'TEST123',
                price: 99.99,
                stock: 100,
                minStock: 10,
                category: 'Test'
            };

            const mockProduct = { ...productData, _id: '1' };

            sandbox.stub(Product, 'findOne').resolves(null);
            sandbox.stub(Product.prototype, 'save').resolves(mockProduct);

            req.body = productData;

            await productController.create(req, res, next);

            expect(res.status.calledWith(201)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.deep.include({
                success: true,
                data: mockProduct
            });
        });

        it('debería manejar SKU duplicado', async () => {
            const productData = {
                name: 'Producto Test',
                sku: 'TEST123',
                price: 99.99,
                stock: 100,
                minStock: 10,
                category: 'Test'
            };

            sandbox.stub(Product, 'findOne').resolves({ _id: '1' });

            req.body = productData;

            await productController.create(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(ValidationError);
        });
    });

    describe('update', () => {
        it('debería actualizar un producto existente', async () => {
            const mockProduct = {
                _id: '1',
                name: 'Producto Original',
                sku: 'TEST123',
                save: sandbox.stub().resolvesThis()
            };

            sandbox.stub(Product, 'findById').resolves(mockProduct);

            req.params.id = '1';
            req.body = { name: 'Producto Actualizado' };

            await productController.update(req, res, next);

            expect(mockProduct.name).to.equal('Producto Actualizado');
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.deep.include({
                success: true,
                data: mockProduct
            });
        });

        it('debería manejar producto no encontrado en actualización', async () => {
            sandbox.stub(Product, 'findById').resolves(null);

            req.params.id = '1';
            req.body = { name: 'Producto Actualizado' };

            await productController.update(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
        });
    });

    describe('delete', () => {
        it('debería eliminar un producto existente', async () => {
            const mockProduct = {
                _id: '1',
                name: 'Producto Test',
                remove: sandbox.stub().resolves()
            };

            sandbox.stub(Product, 'findById').resolves(mockProduct);

            req.params.id = '1';

            await productController.delete(req, res, next);

            expect(mockProduct.remove.calledOnce).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.deep.include({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        });

        it('debería manejar producto no encontrado en eliminación', async () => {
            sandbox.stub(Product, 'findById').resolves(null);

            req.params.id = '1';

            await productController.delete(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
        });
    });
}); 