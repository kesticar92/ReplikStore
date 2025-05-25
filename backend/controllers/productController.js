const Product = require('../models/product');
const { logger } = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

class ProductController {
    async list(req, res, next) {
        try {
            const { page = 1, limit = 10, category, search } = req.query;
            const query = {};

            if (category) {
                query.category = category;
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { sku: { $regex: search, $options: 'i' } }
                ];
            }

            const products = await Product.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });

            const total = await Product.countDocuments(query);

            res.json({
                success: true,
                data: {
                    products,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async get(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            
            if (!product) {
                throw new NotFoundError('Producto no encontrado');
            }

            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const { name, description, sku, price, stock, minStock, category, location } = req.body;

            // Verificar si ya existe un producto con el mismo SKU
            const existingProduct = await Product.findOne({ sku });
            if (existingProduct) {
                throw new ValidationError('Ya existe un producto con este SKU');
            }

            const product = new Product({
                name,
                description,
                sku,
                price,
                stock,
                minStock,
                category,
                location
            });

            await product.save();

            logger.info('Producto creado:', {
                id: product._id,
                name: product.name,
                sku: product.sku
            });

            res.status(201).json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { name, description, price, stock, minStock, category, location } = req.body;
            const product = await Product.findById(req.params.id);

            if (!product) {
                throw new NotFoundError('Producto no encontrado');
            }

            // Actualizar campos si se proporcionan
            if (name) product.name = name;
            if (description !== undefined) product.description = description;
            if (price !== undefined) product.price = price;
            if (stock !== undefined) product.stock = stock;
            if (minStock !== undefined) product.minStock = minStock;
            if (category) product.category = category;
            if (location) product.location = location;

            await product.save();

            logger.info('Producto actualizado:', {
                id: product._id,
                name: product.name,
                sku: product.sku
            });

            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                throw new NotFoundError('Producto no encontrado');
            }

            await product.remove();

            logger.info('Producto eliminado:', {
                id: product._id,
                name: product.name,
                sku: product.sku
            });

            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController(); 