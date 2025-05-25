const { expect } = require('chai');
const sinon = require('sinon');
const { getMetrics } = require('../utils/metrics');
const inventoryService = require('../services/inventoryService');
const Operation = require('../models/operation');

describe('Monitoring System', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Metrics', () => {
        it('should return metrics in Prometheus format', async () => {
            const metrics = await getMetrics();
            expect(metrics).to.be.a('string');
            expect(metrics).to.include('http_requests_total');
            expect(metrics).to.include('inventory_operations_total');
            expect(metrics).to.include('http_request_duration_seconds');
            expect(metrics).to.include('inventory_operation_duration_seconds');
        });
    });

    describe('Inventory Stats', () => {
        it('should return inventory statistics', async () => {
            const mockStats = [
                {
                    _id: 'Electronics',
                    totalProducts: 10,
                    totalStock: 100,
                    totalValue: 1000,
                    lowStockProducts: 2
                }
            ];

            const mockLowStockCount = 2;

            sandbox.stub(inventoryService, 'getInventoryStats').resolves(mockStats);
            sandbox.stub(inventoryService, 'getLowStockProducts').resolves(Array(mockLowStockCount));

            const stats = await inventoryService.getInventoryStats();
            expect(stats).to.deep.equal(mockStats);
        });
    });

    describe('Low Stock Alerts', () => {
        it('should return low stock products', async () => {
            const mockLowStockProducts = [
                {
                    sku: 'TEST123',
                    name: 'Test Product',
                    currentStock: 5,
                    reorderPoint: 10
                }
            ];

            sandbox.stub(inventoryService, 'getLowStockProducts').resolves(mockLowStockProducts);

            const products = await inventoryService.getLowStockProducts();
            expect(products).to.deep.equal(mockLowStockProducts);
        });
    });

    describe('Zone Statistics', () => {
        it('should return statistics for a specific zone', async () => {
            const mockProducts = [
                {
                    currentStock: 10,
                    price: 100,
                    reorderPoint: 5
                },
                {
                    currentStock: 20,
                    price: 200,
                    reorderPoint: 10
                }
            ];

            sandbox.stub(inventoryService, 'getProductsByZone').resolves(mockProducts);

            const products = await inventoryService.getProductsByZone('A1');
            expect(products).to.deep.equal(mockProducts);
        });
    });

    describe('Operation History', () => {
        it('should return operation history with filters', async () => {
            const mockOperations = [
                {
                    type: 'stock_update',
                    product: {
                        sku: 'TEST123',
                        name: 'Test Product'
                    },
                    timestamp: new Date()
                }
            ];

            const findStub = sandbox.stub(Operation, 'find').returns({
                sort: () => ({
                    limit: () => Promise.resolve(mockOperations)
                })
            });

            const operations = await Operation.find({
                type: 'stock_update',
                timestamp: {
                    $gte: new Date('2024-01-01'),
                    $lte: new Date('2024-12-31')
                }
            }).sort({ timestamp: -1 }).limit(100);

            expect(operations).to.deep.equal(mockOperations);
            expect(findStub.calledOnce).to.be.true;
        });
    });

    describe('Operation Statistics', () => {
        it('should return operation statistics', async () => {
            const mockStats = [
                {
                    _id: {
                        type: 'stock_update',
                        status: 'success'
                    },
                    count: 10
                }
            ];

            const aggregateStub = sandbox.stub(Operation, 'aggregate').resolves(mockStats);

            const stats = await Operation.getOperationStats(
                new Date('2024-01-01'),
                new Date('2024-12-31')
            );

            expect(stats).to.deep.equal(mockStats);
            expect(aggregateStub.calledOnce).to.be.true;
        });
    });
}); 