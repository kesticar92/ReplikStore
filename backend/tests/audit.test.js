const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const expect = chai.expect;
const Audit = require('../models/audit');
const User = require('../models/user');
const auditService = require('../services/auditService');

describe('Audit System', () => {
    let testUser;
    let testAudit;

    beforeEach(async () => {
        // Limpiar la base de datos
        await Audit.deleteMany({});
        await User.deleteMany({});

        // Crear usuario de prueba
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin'
        });

        // Crear registro de auditoría de prueba
        testAudit = await Audit.create({
            action: 'create',
            entity: 'product',
            entityId: new mongoose.Types.ObjectId(),
            user: testUser._id,
            changes: {
                before: null,
                after: {
                    name: 'Test Product',
                    price: 100
                }
            },
            ip: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            status: 'success',
            message: 'Producto creado exitosamente'
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Audit Model', () => {
        it('should create a valid audit record', async () => {
            const audit = await Audit.create({
                action: 'update',
                entity: 'product',
                entityId: new mongoose.Types.ObjectId(),
                user: testUser._id,
                changes: {
                    before: { price: 100 },
                    after: { price: 150 }
                },
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0',
                status: 'success',
                message: 'Precio actualizado'
            });

            expect(audit).to.have.property('_id');
            expect(audit.action).to.equal('update');
            expect(audit.entity).to.equal('product');
            expect(audit.user).to.deep.equal(testUser._id);
            expect(audit.changes.before.price).to.equal(100);
            expect(audit.changes.after.price).to.equal(150);
            expect(audit.status).to.equal('success');
        });

        it('should fail to create audit record without required fields', async () => {
            try {
                await Audit.create({
                    action: 'update',
                    message: 'Test message'
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.exist;
                expect(error.errors).to.have.property('entity');
                expect(error.errors).to.have.property('entityId');
                expect(error.errors).to.have.property('user');
                expect(error.errors).to.have.property('ip');
                expect(error.errors).to.have.property('userAgent');
            }
        });

        it('should redact sensitive information', async () => {
            const audit = await Audit.create({
                action: 'update',
                entity: 'user',
                entityId: testUser._id,
                user: testUser._id,
                changes: {
                    before: { password: 'oldpass123' },
                    after: { password: 'newpass123' }
                },
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0',
                status: 'success'
            });

            expect(audit.changes.before.password).to.equal('[REDACTED]');
            expect(audit.changes.after.password).to.equal('[REDACTED]');
        });
    });

    describe('Audit Service', () => {
        it('should log user action', async () => {
            const audit = await auditService.logUserAction(
                testUser._id,
                'create',
                'product',
                new mongoose.Types.ObjectId(),
                { name: 'New Product' }
            );

            expect(audit).to.have.property('_id');
            expect(audit.action).to.equal('create');
            expect(audit.entity).to.equal('product');
            expect(audit.user).to.deep.equal(testUser._id);
        });

        it('should log system event', async () => {
            const audit = await auditService.logSystemEvent(
                'system_event',
                'system',
                new mongoose.Types.ObjectId(),
                'Sistema iniciado'
            );

            expect(audit).to.have.property('_id');
            expect(audit.action).to.equal('system_event');
            expect(audit.entity).to.equal('system');
            expect(audit.user).to.be.null;
            expect(audit.message).to.equal('Sistema iniciado');
        });

        it('should log error', async () => {
            const error = new Error('Test error');
            const audit = await auditService.logError(
                'update',
                'product',
                new mongoose.Types.ObjectId(),
                error,
                testUser._id
            );

            expect(audit).to.have.property('_id');
            expect(audit.action).to.equal('update');
            expect(audit.status).to.equal('failure');
            expect(audit.message).to.equal('Test error');
            expect(audit.metadata.error).to.have.property('name');
            expect(audit.metadata.error).to.have.property('stack');
        });

        it('should get entity history', async () => {
            const history = await auditService.getEntityHistory(
                'product',
                testAudit.entityId
            );

            expect(history).to.be.an('array');
            expect(history).to.have.lengthOf(1);
            expect(history[0]._id).to.deep.equal(testAudit._id);
        });

        it('should get user activity', async () => {
            const activity = await auditService.getUserActivity(testUser._id);

            expect(activity).to.be.an('array');
            expect(activity).to.have.lengthOf(1);
            expect(activity[0]._id).to.deep.equal(testAudit._id);
        });

        it('should get recent activity with pagination', async () => {
            const result = await auditService.getRecentActivity({
                skip: 0,
                limit: 10
            });

            expect(result).to.have.property('activity');
            expect(result).to.have.property('total');
            expect(result).to.have.property('page');
            expect(result).to.have.property('pages');
            expect(result.activity).to.be.an('array');
            expect(result.activity).to.have.lengthOf(1);
        });
    });
}); 