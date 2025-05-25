const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Operation = require('../models/operation');

describe('Operation Model', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('logOperation', () => {
        it('should log a new operation successfully', async () => {
            const operationData = {
                type: 'stock_update',
                product: {
                    sku: 'TEST123',
                    name: 'Test Product',
                    category: 'Test Category',
                    zone: 'A1'
                },
                details: {
                    oldStock: 10,
                    newStock: 5
                },
                user: {
                    id: 'user123',
                    role: 'admin'
                }
            };

            const savedOperation = {
                ...operationData,
                _id: new mongoose.Types.ObjectId(),
                timestamp: new Date()
            };

            const saveStub = sandbox.stub(Operation.prototype, 'save').resolves(savedOperation);

            const operation = await Operation.logOperation(operationData);

            expect(saveStub.calledOnce).to.be.true;
            expect(operation).to.deep.include({
                type: operationData.type,
                product: operationData.product,
                details: operationData.details,
                user: operationData.user
            });
            expect(operation._id).to.exist;
            expect(operation.timestamp).to.exist;
        });

        it('should handle operation logging error', async () => {
            const operationData = {
                type: 'invalid_type',
                product: {
                    sku: 'TEST123'
                }
            };

            const saveStub = sandbox.stub(Operation.prototype, 'save').rejects(new Error('Validation Error'));

            try {
                await Operation.logOperation(operationData);
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Validation Error');
            }
        });
    });

    describe('getOperationsByDateRange', () => {
        it('should return operations within date range', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');
            const options = {
                type: 'stock_update',
                userId: 'user123',
                limit: 50,
                skip: 0
            };

            const mockOperations = [
                {
                    type: 'stock_update',
                    product: { sku: 'TEST123' },
                    user: { id: 'user123' },
                    timestamp: new Date('2024-06-01')
                }
            ];

            const findStub = sandbox.stub(Operation, 'find').returns({
                sort: () => ({
                    limit: () => ({
                        skip: () => Promise.resolve(mockOperations)
                    })
                })
            });

            const operations = await Operation.getOperationsByDateRange(startDate, endDate, options);

            expect(operations).to.deep.equal(mockOperations);
            expect(findStub.calledOnce).to.be.true;
            expect(findStub.firstCall.args[0]).to.deep.include({
                timestamp: {
                    $gte: startDate,
                    $lte: endDate
                },
                type: options.type,
                'user.id': options.userId
            });
        });
    });

    describe('getOperationStats', () => {
        it('should return operation statistics', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const mockStats = [
                {
                    _id: {
                        type: 'stock_update',
                        status: 'success'
                    },
                    count: 10
                },
                {
                    _id: {
                        type: 'create',
                        status: 'success'
                    },
                    count: 5
                }
            ];

            const aggregateStub = sandbox.stub(Operation, 'aggregate').resolves(mockStats);

            const stats = await Operation.getOperationStats(startDate, endDate);

            expect(stats).to.deep.equal(mockStats);
            expect(aggregateStub.calledOnce).to.be.true;
            expect(aggregateStub.firstCall.args[0]).to.deep.include([
                {
                    $match: {
                        timestamp: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                }
            ]);
        });
    });

    describe('Schema Validation', () => {
        it('should validate required fields', async () => {
            const operation = new Operation({
                product: {
                    sku: 'TEST123'
                }
            });

            try {
                await operation.validate();
                throw new Error('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
                expect(error.errors.type).to.exist;
            }
        });

        it('should validate enum values', async () => {
            const operation = new Operation({
                type: 'invalid_type',
                product: {
                    sku: 'TEST123'
                }
            });

            try {
                await operation.validate();
                throw new Error('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
                expect(error.errors.type).to.exist;
            }
        });

        it('should validate product structure', async () => {
            const operation = new Operation({
                type: 'stock_update',
                product: {
                    // Missing required sku field
                }
            });

            try {
                await operation.validate();
                throw new Error('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
                expect(error.errors['product.sku']).to.exist;
            }
        });
    });
}); 