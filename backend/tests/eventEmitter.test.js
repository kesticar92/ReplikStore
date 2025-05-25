require('../config/test');
const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
const notificationService = require('../utils/notifications');
// Stub antes de importar eventEmitter
sinon.stub(notificationService, 'notifyLowStock').resolves();
sinon.stub(notificationService, 'notifyStockUpdate').resolves();
const eventEmitter = require('../utils/eventEmitter');
const logger = require('../utils/logger');

describe('InventoryEventEmitter', () => {
    let notificationStub;

    beforeEach(() => {
        // Crear stubs para las dependencias
        notificationStub = {
            notifyLowStock: sinon.stub().resolves(),
            notifyStockUpdate: sinon.stub().resolves()
        };
        sinon.stub(notificationService, 'notifyLowStock').resolves();
        sinon.stub(notificationService, 'notifyStockUpdate').resolves();
    });

    afterEach(() => {
        // Restaurar todos los stubs, incluyendo los de logger
        sinon.restore();
    });

    describe('lowStock', () => {
        const mockProduct = {
            sku: 'TEST-001',
            name: 'Test Product',
            currentStock: 5,
            reorderPoint: 10,
            category: 'Test Category',
            zone: 'A1'
        };

        it('debería emitir evento de stock bajo correctamente', async () => {
            await eventEmitter.emitLowStock(mockProduct);

            expect(notificationService.notifyLowStock.calledOnce).to.be.true;
            expect(notificationService.notifyLowStock.firstCall.args[0]).to.deep.equal(mockProduct);
        });

        it('debería manejar errores en el evento de stock bajo', async () => {
            const error = new Error('Test error');
            notificationService.notifyLowStock.rejects(error);

            await eventEmitter.emitLowStock(mockProduct);

            expect(logger.error.calledOnce).to.be.true;
            expect(logger.error.firstCall.args[0]).to.include('Error en el manejo del evento lowStock');
        });

        it('no debería emitir evento con producto inválido', async () => {
            await eventEmitter.emitLowStock(null);

            expect(notificationService.notifyLowStock.called).to.be.false;
            expect(logger.error.calledOnce).to.be.true;
        });
    });

    describe('stockUpdated', () => {
        const mockData = {
            sku: 'TEST-001',
            product: {
                name: 'Test Product',
                category: 'Test Category',
                zone: 'A1'
            },
            oldStock: 10,
            newStock: 15,
            type: 'add'
        };

        it('debería emitir evento de actualización de stock correctamente', async () => {
            await eventEmitter.emitStockUpdated(mockData);

            expect(notificationService.notifyStockUpdate.calledOnce).to.be.true;
            expect(notificationService.notifyStockUpdate.firstCall.args).to.deep.equal([
                mockData.product,
                mockData.oldStock,
                mockData.newStock,
                mockData.type
            ]);
        });

        it('debería manejar errores en el evento de actualización de stock', async () => {
            const error = new Error('Test error');
            notificationService.notifyStockUpdate.rejects(error);

            await eventEmitter.emitStockUpdated(mockData);

            expect(logger.error.calledOnce).to.be.true;
            expect(logger.error.firstCall.args[0]).to.include('Error en el manejo del evento stockUpdated');
        });

        it('no debería emitir evento con datos inválidos', async () => {
            await eventEmitter.emitStockUpdated({});

            expect(notificationService.notifyStockUpdate.called).to.be.false;
            expect(logger.error.calledOnce).to.be.true;
        });
    });

    describe('productCreated', () => {
        const mockProduct = {
            sku: 'TEST-001',
            name: 'Test Product',
            category: 'Test Category'
        };

        it('debería emitir evento de producto creado correctamente', async () => {
            await eventEmitter.emitProductCreated(mockProduct);

            expect(logger.info.calledOnce).to.be.true;
            expect(logger.info.firstCall.args[0]).to.include('productCreated');
        });

        it('debería manejar errores en el evento de producto creado', async () => {
            const error = new Error('Test error');
            logger.info.throws(error);

            await eventEmitter.emitProductCreated(mockProduct);

            expect(logger.error.calledOnce).to.be.true;
            expect(logger.error.firstCall.args[0]).to.include('Error en el manejo del evento productCreated');
        });

        it('no debería emitir evento con producto inválido', async () => {
            await eventEmitter.emitProductCreated(null);

            expect(logger.info.called).to.be.false;
            expect(logger.error.calledOnce).to.be.true;
        });
    });

    describe('productUpdated', () => {
        const mockData = {
            sku: 'TEST-001',
            changes: {
                name: 'Updated Product',
                price: 99.99
            }
        };

        it('debería emitir evento de producto actualizado correctamente', async () => {
            await eventEmitter.emitProductUpdated(mockData);

            expect(logger.info.calledOnce).to.be.true;
            expect(logger.info.firstCall.args[0]).to.include('productUpdated');
        });

        it('debería manejar errores en el evento de producto actualizado', async () => {
            const error = new Error('Test error');
            logger.info.throws(error);

            await eventEmitter.emitProductUpdated(mockData);

            expect(logger.error.calledOnce).to.be.true;
            expect(logger.error.firstCall.args[0]).to.include('Error en el manejo del evento productUpdated');
        });

        it('no debería emitir evento con datos inválidos', async () => {
            await eventEmitter.emitProductUpdated({});

            expect(logger.info.called).to.be.false;
            expect(logger.error.calledOnce).to.be.true;
        });
    });

    describe('productDeleted', () => {
        const mockSku = 'TEST-001';

        it('debería emitir evento de producto eliminado correctamente', async () => {
            await eventEmitter.emitProductDeleted(mockSku);

            expect(logger.info.calledOnce).to.be.true;
            expect(logger.info.firstCall.args[0]).to.include('productDeleted');
        });

        it('debería manejar errores en el evento de producto eliminado', async () => {
            const error = new Error('Test error');
            logger.info.throws(error);

            await eventEmitter.emitProductDeleted(mockSku);

            expect(logger.error.calledOnce).to.be.true;
            expect(logger.error.firstCall.args[0]).to.include('Error en el manejo del evento productDeleted');
        });

        it('no debería emitir evento con SKU inválido', async () => {
            await eventEmitter.emitProductDeleted(null);

            expect(logger.info.called).to.be.false;
            expect(logger.error.calledOnce).to.be.true;
        });
    });

    describe('cleanup', () => {
        it('debería limpiar todos los listeners', () => {
            eventEmitter.cleanup();

            expect(logger.info.calledOnce).to.be.true;
            expect(logger.info.firstCall.args[0]).to.include('Todos los listeners de eventos han sido removidos');
        });
    });
}); 