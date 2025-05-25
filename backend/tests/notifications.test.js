const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const notificationService = require('../services/notificationService');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const axios = require('axios');

describe('NotificationService', () => {
    let sandbox;
    let notificationService;
    let emailStub;
    let smsStub;
    let webhookStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock de nodemailer
        sandbox.stub(require('nodemailer'), 'createTransport').returns({
            sendMail: sandbox.stub().resolves({ messageId: 'test-id' })
        });
        // Mock de twilio
        sandbox.stub(require('twilio'), 'Client').returns({
            messages: {
                create: sandbox.stub().resolves({ sid: 'test-sid' })
            }
        });

        // Crear una nueva instancia del servicio para cada prueba
        notificationService = new NotificationService();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('sendEmail', () => {
        it('debería enviar un email correctamente', async () => {
            const result = await notificationService.sendEmail({
                to: 'test@example.com',
                subject: 'Test',
                text: 'Test message'
            });
            expect(result).to.be.true;
        });

        it('debería lanzar error si faltan campos requeridos', async () => {
            try {
                await notificationService.sendEmail();
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.include('Faltan campos requeridos');
            }
        });
    });

    describe('sendSMS', () => {
        it('debería enviar un SMS correctamente', async () => {
            const to = '+1234567890';
            const message = 'Test Message';

            await notificationService.sendSMS(to, message);

            expect(smsStub.calledOnce).to.be.true;
        });

        it('debería lanzar error si faltan campos requeridos', async () => {
            try {
                await notificationService.sendSMS();
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.include('Faltan campos requeridos');
            }
        });
    });

    describe('sendWebhook', () => {
        it('debería enviar un webhook correctamente', async () => {
            const url = 'http://test.com/webhook';
            const payload = { test: 'data' };

            await notificationService.sendWebhook(url, payload);

            expect(webhookStub.calledOnce).to.be.true;
            expect(webhookStub.firstCall.args[0]).to.equal(url);
            expect(webhookStub.firstCall.args[1]).to.deep.equal(payload);
        });

        it('debería lanzar error si faltan campos requeridos', async () => {
            try {
                await notificationService.sendWebhook();
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.include('Faltan campos requeridos');
            }
        });
    });

    describe('notifyLowStock', () => {
        const mockProduct = {
            sku: 'TEST-001',
            name: 'Test Product',
            currentStock: 5,
            reorderPoint: 10,
            category: 'Test Category',
            zone: 'A1'
        };

        it('debería enviar notificaciones de stock bajo', async () => {
            process.env.NOTIFY_EMAIL = 'test@example.com';
            process.env.NOTIFY_SMS = '+1234567890';
            process.env.NOTIFY_WEBHOOK = 'http://test.com/webhook';

            await notificationService.notifyLowStock(mockProduct);

            expect(emailStub.calledOnce).to.be.true;
            expect(smsStub.calledOnce).to.be.true;
            expect(webhookStub.calledOnce).to.be.true;
        });

        it('debería lanzar error si el producto es inválido', async () => {
            try {
                await notificationService.notifyLowStock();
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.include('Producto inválido');
            }
        });
    });

    describe('notifyStockUpdate', () => {
        const mockProduct = {
            sku: 'TEST-001',
            name: 'Test Product',
            category: 'Test Category',
            zone: 'A1'
        };

        it('debería enviar notificaciones de actualización de stock', async () => {
            process.env.NOTIFY_EMAIL = 'test@example.com';
            process.env.NOTIFY_WEBHOOK = 'http://test.com/webhook';

            await notificationService.notifyStockUpdate(
                mockProduct,
                10,
                15,
                'add'
            );

            expect(emailStub.calledOnce).to.be.true;
            expect(webhookStub.calledOnce).to.be.true;
        });

        it('debería lanzar error si el producto es inválido', async () => {
            try {
                await notificationService.notifyStockUpdate();
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.include('Producto inválido');
            }
        });
    });

    describe('_replaceTemplateVariables', () => {
        it('debería reemplazar variables en la plantilla', () => {
            const template = 'Hola {{name}}, tu stock es {{stock}}';
            const data = { name: 'Test', stock: 10 };

            const result = notificationService._replaceTemplateVariables(template, data);

            expect(result).to.equal('Hola Test, tu stock es 10');
        });

        it('debería mantener el texto original si la variable no existe', () => {
            const template = 'Hola {{name}}, tu stock es {{stock}}';
            const data = { name: 'Test' };

            const result = notificationService._replaceTemplateVariables(template, data);

            expect(result).to.equal('Hola Test, tu stock es {{stock}}');
        });
    });
}); 