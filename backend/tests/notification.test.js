const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const expect = chai.expect;
const Notification = require('../models/notification');
const User = require('../models/user');
const notificationService = require('../services/notificationService');

describe('Notification System', () => {
    let testUser;
    let testNotification;

    beforeEach(async () => {
        // Limpiar la base de datos
        await Notification.deleteMany({});
        await User.deleteMany({});

        // Crear usuario de prueba
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin'
        });

        // Crear notificación de prueba
        testNotification = await Notification.create({
            type: 'low_stock',
            title: 'Stock Bajo',
            message: 'El producto X tiene stock bajo',
            level: 'warning',
            recipients: [testUser._id],
            metadata: {
                productId: new mongoose.Types.ObjectId(),
                currentStock: 5,
                minStock: 10
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Notification Model', () => {
        it('should create a valid notification', async () => {
            const notification = await Notification.create({
                type: 'stock_update',
                title: 'Actualización de Stock',
                message: 'El stock ha sido actualizado',
                recipients: [testUser._id]
            });

            expect(notification).to.have.property('_id');
            expect(notification.type).to.equal('stock_update');
            expect(notification.title).to.equal('Actualización de Stock');
            expect(notification.message).to.equal('El stock ha sido actualizado');
            expect(notification.level).to.equal('info');
            expect(notification.recipients).to.include(testUser._id);
            expect(notification.readBy).to.be.an('array').that.is.empty;
        });

        it('should fail to create notification without required fields', async () => {
            try {
                await Notification.create({
                    title: 'Test Notification'
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.exist;
                expect(error.errors).to.have.property('type');
                expect(error.errors).to.have.property('message');
                expect(error.errors).to.have.property('recipients');
            }
        });

        it('should mark notification as read', async () => {
            await testNotification.markAsRead(testUser._id);
            expect(testNotification.readBy).to.include(testUser._id);
        });

        it('should find unread notifications', async () => {
            const unread = await Notification.findUnreadByUser(testUser._id);
            expect(unread).to.be.an('array');
            expect(unread).to.have.lengthOf(1);
            expect(unread[0]._id).to.deep.equal(testNotification._id);
        });
    });

    describe('Notification Service', () => {
        it('should create and broadcast notification', async () => {
            const notificationData = {
                type: 'inventory_alert',
                title: 'Alerta de Inventario',
                message: 'Movimiento de inventario detectado',
                recipients: [testUser._id],
                level: 'info'
            };

            const notification = await notificationService.createNotification(notificationData);
            expect(notification).to.have.property('_id');
            expect(notification.type).to.equal('inventory_alert');
            expect(notification.recipients).to.include(testUser._id);
        });

        it('should notify low stock', async () => {
            const product = {
                _id: new mongoose.Types.ObjectId(),
                name: 'Test Product',
                stock: 5,
                minStock: 10
            };

            const notification = await notificationService.notifyLowStock(product);
            expect(notification).to.have.property('_id');
            expect(notification.type).to.equal('low_stock');
            expect(notification.level).to.equal('warning');
            expect(notification.metadata).to.have.property('productId');
            expect(notification.metadata.currentStock).to.equal(5);
            expect(notification.metadata.minStock).to.equal(10);
        });

        it('should notify stock update', async () => {
            const product = {
                _id: new mongoose.Types.ObjectId(),
                name: 'Test Product',
                stock: 15
            };

            const notification = await notificationService.notifyStockUpdate(product, 10, 'in');
            expect(notification).to.have.property('_id');
            expect(notification.type).to.equal('stock_update');
            expect(notification.level).to.equal('info');
            expect(notification.metadata).to.have.property('productId');
            expect(notification.metadata.quantity).to.equal(10);
            expect(notification.metadata.operation).to.equal('in');
        });
    });

    describe('WebSocket Integration', () => {
        it('should handle client connection', () => {
            const mockClient = {
                id: 'test-client',
                send: sinon.spy()
            };

            notificationService.handleClientConnection(mockClient, testUser._id);
            expect(mockClient.send.called).to.be.true;
        });

        it('should broadcast notification to connected clients', () => {
            const mockClient = {
                id: 'test-client',
                send: sinon.spy()
            };

            notificationService.handleClientConnection(mockClient, testUser._id);
            notificationService.broadcastNotification(testNotification);
            expect(mockClient.send.called).to.be.true;
        });
    });
}); 