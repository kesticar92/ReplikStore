const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const expect = chai.expect;
const Report = require('../models/report');
const User = require('../models/user');
const reportService = require('../services/reportService');

describe('Report System', () => {
    let testUser;
    let testReport;

    beforeEach(async () => {
        // Limpiar la base de datos
        await Report.deleteMany({});
        await User.deleteMany({});

        // Crear usuario de prueba
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin'
        });

        // Crear reporte de prueba
        testReport = await Report.create({
            type: 'inventory_summary',
            title: 'Resumen de Inventario',
            description: 'Resumen general del inventario',
            parameters: {
                startDate: new Date(),
                endDate: new Date()
            },
            data: {
                totalProducts: 100,
                lowStockProducts: 5,
                inventoryValue: 50000
            },
            generatedBy: testUser._id,
            status: 'completed',
            completed_at: new Date()
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Report Model', () => {
        it('should create a valid report', async () => {
            const report = await Report.create({
                type: 'stock_movement',
                title: 'Movimientos de Stock',
                description: 'Registro de movimientos',
                parameters: {
                    startDate: new Date(),
                    endDate: new Date()
                },
                data: {
                    movements: [],
                    totalMovements: 0
                },
                generatedBy: testUser._id,
                status: 'completed',
                completed_at: new Date()
            });

            expect(report).to.have.property('_id');
            expect(report.type).to.equal('stock_movement');
            expect(report.status).to.equal('completed');
            expect(report.generatedBy).to.deep.equal(testUser._id);
        });

        it('should fail to create report without required fields', async () => {
            try {
                await Report.create({
                    title: 'Test Report',
                    description: 'Test Description'
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.exist;
                expect(error.errors).to.have.property('type');
                expect(error.errors).to.have.property('generatedBy');
                expect(error.errors).to.have.property('data');
            }
        });

        it('should update completed_at when status changes to completed', async () => {
            const report = await Report.create({
                type: 'low_stock_alert',
                title: 'Alertas de Stock',
                description: 'Productos con stock bajo',
                parameters: {},
                data: {},
                generatedBy: testUser._id,
                status: 'pending'
            });

            report.status = 'completed';
            await report.save();

            expect(report.completed_at).to.exist;
            expect(report.completed_at).to.be.instanceOf(Date);
        });
    });

    describe('Report Service', () => {
        it('should generate inventory summary report', async () => {
            const report = await reportService.generateReport(
                'inventory_summary',
                {
                    startDate: new Date(),
                    endDate: new Date()
                },
                testUser._id
            );

            expect(report).to.have.property('_id');
            expect(report.type).to.equal('inventory_summary');
            expect(report.status).to.equal('processing');
            expect(report.generatedBy).to.deep.equal(testUser._id);
        });

        it('should generate stock movement report', async () => {
            const report = await reportService.generateReport(
                'stock_movement',
                {
                    startDate: new Date(),
                    endDate: new Date(),
                    productId: new mongoose.Types.ObjectId()
                },
                testUser._id
            );

            expect(report).to.have.property('_id');
            expect(report.type).to.equal('stock_movement');
            expect(report.status).to.equal('processing');
        });

        it('should generate low stock alert report', async () => {
            const report = await reportService.generateReport(
                'low_stock_alert',
                { threshold: 5 },
                testUser._id
            );

            expect(report).to.have.property('_id');
            expect(report.type).to.equal('low_stock_alert');
            expect(report.status).to.equal('processing');
        });

        it('should get reports with pagination', async () => {
            const result = await reportService.getReports({
                skip: 0,
                limit: 10
            });

            expect(result).to.have.property('reports');
            expect(result).to.have.property('total');
            expect(result).to.have.property('page');
            expect(result).to.have.property('pages');
            expect(result.reports).to.be.an('array');
            expect(result.reports).to.have.lengthOf(1);
        });

        it('should get reports filtered by type', async () => {
            const result = await reportService.getReports({
                type: 'inventory_summary'
            });

            expect(result.reports).to.be.an('array');
            expect(result.reports[0].type).to.equal('inventory_summary');
        });

        it('should get reports filtered by status', async () => {
            const result = await reportService.getReports({
                status: 'completed'
            });

            expect(result.reports).to.be.an('array');
            expect(result.reports[0].status).to.equal('completed');
        });
    });

    describe('Report Processing', () => {
        it('should process inventory summary report', async () => {
            const report = await reportService.generateReport(
                'inventory_summary',
                {},
                testUser._id
            );

            await reportService.processReport(report._id);
            const processedReport = await Report.findById(report._id);

            expect(processedReport.status).to.equal('completed');
            expect(processedReport.data).to.have.property('totalProducts');
            expect(processedReport.data).to.have.property('lowStockProducts');
            expect(processedReport.data).to.have.property('inventoryValue');
        });

        it('should handle processing errors', async () => {
            const report = await reportService.generateReport(
                'invalid_type',
                {},
                testUser._id
            );

            try {
                await reportService.processReport(report._id);
                expect.fail('Should have thrown an error');
            } catch (error) {
                const failedReport = await Report.findById(report._id);
                expect(failedReport.status).to.equal('failed');
                expect(failedReport.error).to.have.property('message');
            }
        });
    });
}); 