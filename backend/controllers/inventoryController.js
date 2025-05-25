const inventoryService = require('../services/inventoryService');
const { catchAsync } = require('../utils/catchAsync');
const Inventory = require('../models/inventory');
const Product = require('../models/product');
const { logger } = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { generateReference } = require('../utils/helpers');

const inventoryController = {
    getAllProducts: catchAsync(async (req, res) => {
        const { page = 1, limit = 10, ...query } = req.query;
        const products = await inventoryService.getAllProducts(query);
        
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: products.length
            }
        });
    }),

    getProductBySKU: catchAsync(async (req, res) => {
        const product = await inventoryService.getProductBySKU(req.params.sku);
        res.status(200).json({
            success: true,
            data: product
        });
    }),

    createProduct: catchAsync(async (req, res, next) => {
        try {
            const product = await inventoryService.createProduct(req.body, req.user);
            res.status(201).json({
                success: true,
                data: product,
                message: 'Producto creado exitosamente'
            });
        } catch (error) {
            if (error.name === 'ConflictError') {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                    errors: []
                });
            }
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: error.errors || []
                });
            }
            next(error);
        }
    }),

    updateProduct: catchAsync(async (req, res, next) => {
        try {
            const product = await inventoryService.updateProduct(req.params.sku, req.body, req.user);
            res.status(200).json({
                success: true,
                data: product,
                message: 'Producto actualizado exitosamente'
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: error.errors || []
                });
            }
            next(error);
        }
    }),

    updateStock: catchAsync(async (req, res, next) => {
        try {
            const { quantity, type } = req.body;
            const product = await inventoryService.updateStock(req.params.sku, quantity, type, req.user);
            res.status(200).json({
                success: true,
                data: product,
                message: 'Stock actualizado exitosamente'
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: error.errors || []
                });
            }
            next(error);
        }
    }),

    getLowStockProducts: catchAsync(async (req, res) => {
        const products = await inventoryService.getLowStockProducts();
        res.status(200).json({
            success: true,
            data: products,
            count: products.length
        });
    }),

    getProductsByZone: catchAsync(async (req, res, next) => {
        try {
            const result = await inventoryService.getProductsByZone(req.params.zone);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: error.errors || []
                });
            }
            next(error);
        }
    }),

    deleteProduct: catchAsync(async (req, res, next) => {
        try {
            await inventoryService.deleteProduct(req.params.sku, req.user);
            res.status(200).json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        } catch (error) {
            if (error.name === 'NotFoundError') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
        }
    }),

    getInventoryStats: catchAsync(async (req, res) => {
        const stats = await inventoryService.getInventoryStats();
        res.status(200).json({
            success: true,
            data: stats,
            summary: {
                totalCategories: stats.length,
                totalProducts: stats.reduce((sum, cat) => sum + cat.totalProducts, 0),
                totalStock: stats.reduce((sum, cat) => sum + cat.totalStock, 0),
                totalValue: stats.reduce((sum, cat) => sum + cat.totalValue, 0),
                lowStockProducts: stats.reduce((sum, cat) => sum + cat.lowStockProducts, 0)
            }
        });
    }),

    list: catchAsync(async (req, res, next) => {
        try {
            const { page = 1, limit = 10, product, location, type, status } = req.query;
            const query = {};

            if (product) query.product = product;
            if (location) query.location = location.toUpperCase();
            if (type) query.type = type;
            if (status) query.status = status;

            const movements = await Inventory.find(query)
                .populate('product', 'name sku')
                .populate('operator', 'name email')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ created_at: -1 });

            const total = await Inventory.countDocuments(query);

            res.json({
                success: true,
                data: {
                    movements,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }),

    get: catchAsync(async (req, res, next) => {
        try {
            const movement = await Inventory.findById(req.params.id)
                .populate('product', 'name sku')
                .populate('operator', 'name email');

            if (!movement) {
                throw new NotFoundError('Movimiento no encontrado');
            }

            res.json({
                success: true,
                data: movement
            });
        } catch (error) {
            next(error);
        }
    }),

    create: catchAsync(async (req, res, next) => {
        try {
            const { product, quantity, type, location, notes } = req.body;

            // Verificar que el producto existe
            const productExists = await Product.findById(product);
            if (!productExists) {
                throw new NotFoundError('Producto no encontrado');
            }

            // Verificar stock suficiente para salidas
            if ((type === 'out' || type === 'return') && productExists.currentStock < quantity) {
                throw new ValidationError('Stock insuficiente');
            }

            const movement = new Inventory({
                product,
                quantity,
                type,
                reference: generateReference(type),
                location: location.toUpperCase(),
                notes,
                operator: req.user._id
            });

            await movement.save();

            logger.info('Movimiento de inventario creado:', {
                id: movement._id,
                product: productExists.name,
                type,
                quantity
            });

            res.status(201).json({
                success: true,
                data: movement
            });
        } catch (error) {
            next(error);
        }
    }),

    update: catchAsync(async (req, res, next) => {
        try {
            const { notes, status } = req.body;
            const movement = await Inventory.findById(req.params.id);

            if (!movement) {
                throw new NotFoundError('Movimiento no encontrado');
            }

            if (movement.status === 'completed') {
                throw new ValidationError('No se puede modificar un movimiento completado');
            }

            if (notes) movement.notes = notes;
            if (status) {
                if (status === 'completed') {
                    await movement.complete();
                } else if (status === 'cancelled') {
                    await movement.cancel();
                } else {
                    throw new ValidationError('Estado inválido');
                }
            }

            await movement.save();

            logger.info('Movimiento de inventario actualizado:', {
                id: movement._id,
                status: movement.status
            });

            res.json({
                success: true,
                data: movement
            });
        } catch (error) {
            next(error);
        }
    }),

    getProductMovements: catchAsync(async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const movements = await Inventory.findByProduct(productId)
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Inventory.countDocuments({ product: productId });

            res.json({
                success: true,
                data: {
                    movements,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }),

    getLocationMovements: catchAsync(async (req, res, next) => {
        try {
            const { location } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const movements = await Inventory.findByLocation(location)
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Inventory.countDocuments({ location: location.toUpperCase() });

            res.json({
                success: true,
                data: {
                    movements,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    })
};

module.exports = inventoryController; 