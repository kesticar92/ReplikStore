const Report = require('../models/report');
const Inventory = require('../models/inventory');
const Product = require('../models/product');
const User = require('../models/user');
const Audit = require('../models/audit');
const { logger } = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

class ReportService {
    async generateReport(type, parameters, userId) {
        try {
            // Crear reporte pendiente
            const report = await Report.generateReport({
                type,
                title: this.getReportTitle(type),
                description: this.getReportDescription(type),
                parameters,
                generatedBy: userId,
                status: 'processing'
            });

            // Generar datos del reporte en segundo plano
            this.processReport(report._id).catch(error => {
                logger.error('Error procesando reporte:', error);
            });

            return report;
        } catch (error) {
            logger.error('Error generando reporte:', error);
            throw error;
        }
    }

    async processReport(reportId) {
        const report = await Report.findById(reportId);
        if (!report) throw new NotFoundError('Reporte no encontrado');

        try {
            let data;
            switch (report.type) {
                case 'inventory_summary':
                    data = await this.generateInventorySummary(report.parameters);
                    break;
                case 'stock_movement':
                    data = await this.generateStockMovement(report.parameters);
                    break;
                case 'low_stock_alert':
                    data = await this.generateLowStockAlert(report.parameters);
                    break;
                case 'sales_analysis':
                    data = await this.generateSalesAnalysis(report.parameters);
                    break;
                case 'user_activity':
                    data = await this.generateUserActivity(report.parameters);
                    break;
                case 'system_health':
                    data = await this.generateSystemHealth(report.parameters);
                    break;
                default:
                    throw new Error('Tipo de reporte no soportado');
            }

            report.data = data;
            report.status = 'completed';
            await report.save();

            return report;
        } catch (error) {
            report.status = 'failed';
            report.error = {
                message: error.message,
                stack: error.stack
            };
            await report.save();
            throw error;
        }
    }

    async generateInventorySummary(parameters = {}) {
        const { startDate, endDate } = parameters;
        const query = {};
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const [totalProducts, lowStockProducts, inventoryValue] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ stock: { $lt: 10 } }),
            Inventory.aggregate([
                { $match: query },
                { $group: { _id: null, total: { $sum: '$value' } } }
            ])
        ]);

        return {
            totalProducts,
            lowStockProducts,
            inventoryValue: inventoryValue[0]?.total || 0,
            lastUpdated: new Date()
        };
    }

    async generateStockMovement(parameters = {}) {
        const { startDate, endDate, productId } = parameters;
        const query = {};
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (productId) query.product = productId;

        const movements = await Inventory.find(query)
            .sort({ created_at: -1 })
            .populate('product', 'name sku')
            .lean();

        return {
            movements,
            totalMovements: movements.length,
            period: {
                start: startDate ? new Date(startDate) : null,
                end: endDate ? new Date(endDate) : null
            }
        };
    }

    async generateLowStockAlert(parameters = {}) {
        const { threshold = 10 } = parameters;
        const products = await Product.find({ stock: { $lt: threshold } })
            .select('name sku stock price')
            .sort({ stock: 1 })
            .lean();

        return {
            products,
            totalProducts: products.length,
            threshold,
            generatedAt: new Date()
        };
    }

    async generateSalesAnalysis(parameters = {}) {
        const { startDate, endDate } = parameters;
        const query = { type: 'sale' };
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const sales = await Inventory.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: '$created_at' },
                        month: { $month: '$created_at' },
                        day: { $dayOfMonth: '$created_at' }
                    },
                    total: { $sum: '$value' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        return {
            sales,
            period: {
                start: startDate ? new Date(startDate) : null,
                end: endDate ? new Date(endDate) : null
            }
        };
    }

    async generateUserActivity(parameters = {}) {
        const { startDate, endDate, userId } = parameters;
        const query = {};
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (userId) query.user = userId;

        const activities = await Audit.find(query)
            .sort({ created_at: -1 })
            .populate('user', 'username email')
            .lean();

        return {
            activities,
            totalActivities: activities.length,
            period: {
                start: startDate ? new Date(startDate) : null,
                end: endDate ? new Date(endDate) : null
            }
        };
    }

    async generateSystemHealth(parameters = {}) {
        const { startDate, endDate } = parameters;
        const query = {};
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const [totalUsers, activeUsers, systemEvents] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
            Audit.find({ ...query, entity: 'system' })
                .sort({ created_at: -1 })
                .limit(100)
                .lean()
        ]);

        return {
            totalUsers,
            activeUsers,
            systemEvents,
            generatedAt: new Date()
        };
    }

    getReportTitle(type) {
        const titles = {
            inventory_summary: 'Resumen de Inventario',
            stock_movement: 'Movimientos de Stock',
            low_stock_alert: 'Alertas de Stock Bajo',
            sales_analysis: 'Análisis de Ventas',
            user_activity: 'Actividad de Usuarios',
            system_health: 'Estado del Sistema'
        };
        return titles[type] || 'Reporte';
    }

    getReportDescription(type) {
        const descriptions = {
            inventory_summary: 'Resumen general del estado actual del inventario',
            stock_movement: 'Registro de movimientos de stock en el período especificado',
            low_stock_alert: 'Productos con stock por debajo del umbral establecido',
            sales_analysis: 'Análisis de ventas y tendencias',
            user_activity: 'Registro de actividad de usuarios en el sistema',
            system_health: 'Estado general y métricas del sistema'
        };
        return descriptions[type] || '';
    }

    async getReports(options = {}) {
        const query = {};
        if (options.type) query.type = options.type;
        if (options.status) query.status = options.status;
        if (options.generatedBy) query.generatedBy = options.generatedBy;

        const reports = await Report.find(query)
            .sort({ created_at: -1 })
            .populate('generatedBy', 'username email')
            .skip(options.skip || 0)
            .limit(options.limit || 20);

        const total = await Report.countDocuments(query);

        return {
            reports,
            total,
            page: Math.floor((options.skip || 0) / (options.limit || 20)) + 1,
            pages: Math.ceil(total / (options.limit || 20))
        };
    }
}

module.exports = new ReportService(); 