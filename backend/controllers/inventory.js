const Product = require('../models/product');
const { validationResult } = require('express-validator');

// Obtener todos los productos
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

// Obtener un producto por SKU
exports.getProductBySku = async (req, res) => {
    try {
        const product = await Product.findOne({ sku: req.params.sku });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

// Crear un nuevo producto
exports.createProduct = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const product = new Product(req.body);
        await product.save();

        // Emitir evento de actualización
        if (global.broadcastUpdate) {
            global.broadcastUpdate('product_created', product);
        }

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

// Actualizar stock de un producto
exports.updateStock = async (req, res) => {
    try {
        const { quantity, type } = req.body;
        const product = await Product.findOne({ sku: req.params.sku });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const oldStock = product.currentStock;
        product.currentStock = Math.max(0, product.currentStock + quantity);
        product.lastUpdated = Date.now();
        await product.save();

        // Emitir evento de actualización
        if (global.broadcastUpdate) {
            global.broadcastUpdate('stock_updated', {
                sku: product.sku,
                oldStock,
                newStock: product.currentStock,
                change: quantity,
                type: type || 'manual'
            });
        }

        // Verificar si se necesita reordenar
        if (product.needsReorder()) {
            if (global.broadcastUpdate) {
                global.broadcastUpdate('reorder_needed', {
                    sku: product.sku,
                    currentStock: product.currentStock,
                    reorderPoint: product.reorderPoint,
                    suggestedOrder: product.suggestedOrderQuantity()
                });
            }
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar stock',
            error: error.message
        });
    }
};

// Obtener productos que necesitan reorden
exports.getReorderNeeded = async (req, res) => {
    try {
        const products = await Product.find({
            currentStock: { $lte: '$reorderPoint' }
        });

        res.json({
            success: true,
            data: products.map(product => ({
                sku: product.sku,
                name: product.name,
                currentStock: product.currentStock,
                reorderPoint: product.reorderPoint,
                suggestedOrder: product.suggestedOrderQuantity()
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos que necesitan reorden',
            error: error.message
        });
    }
};

// Obtener estado del inventario por zona
exports.getInventoryByZone = async (req, res) => {
    try {
        const products = await Product.find({ zone: req.params.zone });
        const zoneStatus = {
            zone: req.params.zone,
            totalProducts: products.length,
            lowStock: products.filter(p => p.needsReorder()).length,
            products: products.map(p => ({
                sku: p.sku,
                name: p.name,
                currentStock: p.currentStock,
                status: p.status
            }))
        };

        res.json({
            success: true,
            data: zoneStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado del inventario por zona',
            error: error.message
        });
    }
}; 