const Product = require('../models/product');
const Operation = require('../models/operation');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const eventEmitter = require('../utils/eventEmitter');
const { recordInventoryOperation } = require('../utils/metrics');
const notificationService = require('../utils/notifications');

class InventoryService {
    async getAllProducts(query = {}) {
        const start = Date.now();
        try {
            const { category, zone, status, minStock, maxStock, sortBy = 'updated_at', sortOrder = 'desc' } = query;
            const filter = {};

            if (category) filter.category = category;
            if (zone) filter.zone = zone.toUpperCase();
            if (status) filter.status = status;
            if (minStock !== undefined) filter.currentStock = { $gte: Number(minStock) };
            if (maxStock !== undefined) {
                filter.currentStock = { ...filter.currentStock, $lte: Number(maxStock) };
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const products = await Product.find(filter)
                .sort(sort)
                .exec();

            recordInventoryOperation('getAllProducts', 'success', (Date.now() - start) / 1000);
            return products.map(product => product.toObject());
        } catch (error) {
            recordInventoryOperation('getAllProducts', 'error', (Date.now() - start) / 1000);
            throw error;
        }
    }

    async getProductBySKU(sku) {
        const start = Date.now();
        try {
            if (!sku || typeof sku !== 'string') {
                throw new ValidationError('SKU inválido', ['El SKU es requerido y debe ser una cadena de texto']);
            }

            const product = await Product.findBySKU(sku);
            if (!product) {
                throw new NotFoundError('Producto no encontrado');
            }
            recordInventoryOperation('getProductBySKU', 'success', (Date.now() - start) / 1000);
            return product;
        } catch (error) {
            recordInventoryOperation('getProductBySKU', 'error', (Date.now() - start) / 1000);
            throw error;
        }
    }

    async createProduct(productData, user) {
        const start = Date.now();
        try {
            // Validar datos requeridos
            const requiredFields = ['name', 'sku', 'price', 'currentStock', 'minStock', 'maxStock', 'reorderPoint', 'category', 'zone'];
            const missingFields = requiredFields.filter(field => !productData[field]);
            
            if (missingFields.length > 0) {
                throw new ValidationError('Datos incompletos', missingFields.map(field => `El campo ${field} es requerido`));
            }

            // Validar valores numéricos
            const numericFields = ['price', 'currentStock', 'minStock', 'maxStock', 'reorderPoint'];
            const invalidNumbers = numericFields.filter(field => 
                typeof productData[field] !== 'number' || isNaN(productData[field]) || productData[field] < 0
            );
            
            if (invalidNumbers.length > 0) {
                throw new ValidationError('Valores numéricos inválidos', 
                    invalidNumbers.map(field => `El campo ${field} debe ser un número positivo`));
            }

            const product = new Product(productData);
            await product.validate();
            const savedProduct = await product.save();
            
            await Operation.logOperation({
                type: 'create',
                product: {
                    sku: savedProduct.sku,
                    name: savedProduct.name,
                    category: savedProduct.category,
                    zone: savedProduct.zone
                },
                user: {
                    id: user?.id || 'system',
                    role: user?.role || 'system'
                }
            });
            
            eventEmitter.emitProductCreated(savedProduct);
            recordInventoryOperation('createProduct', 'success', (Date.now() - start) / 1000);
            
            return savedProduct;
        } catch (error) {
            recordInventoryOperation('createProduct', 'error', (Date.now() - start) / 1000);
            if (error.code === 11000) {
                throw new ConflictError('SKU duplicado');
            }
            if (error.name === 'ValidationError') {
                throw new ValidationError('Datos de producto inválidos', error.errors);
            }
            throw error;
        }
    }

    async updateProduct(sku, updateData, user) {
        const start = Date.now();
        try {
            const product = await this.getProductBySKU(sku);
            const oldData = { ...product.toObject() };
            
            // Validar campos no modificables
            const nonUpdatableFields = ['sku', 'created_at'];
            const invalidUpdates = Object.keys(updateData).filter(field => nonUpdatableFields.includes(field));
            
            if (invalidUpdates.length > 0) {
                throw new ValidationError('Campos no modificables', 
                    invalidUpdates.map(field => `El campo ${field} no puede ser modificado`));
            }

            // Validar valores numéricos si están presentes
            const numericFields = ['price', 'currentStock', 'minStock', 'maxStock', 'reorderPoint'];
            const invalidNumbers = numericFields.filter(field => 
                updateData[field] !== undefined && 
                (typeof updateData[field] !== 'number' || isNaN(updateData[field]) || updateData[field] < 0)
            );
            
            if (invalidNumbers.length > 0) {
                throw new ValidationError('Valores numéricos inválidos', 
                    invalidNumbers.map(field => `El campo ${field} debe ser un número positivo`));
            }
            
            Object.keys(updateData).forEach(key => {
                if (!nonUpdatableFields.includes(key)) {
                    product[key] = updateData[key];
                }
            });

            await product.validate();
            const updatedProduct = await product.save();
            
            await Operation.logOperation({
                type: 'update',
                product: {
                    sku: updatedProduct.sku,
                    name: updatedProduct.name,
                    category: updatedProduct.category,
                    zone: updatedProduct.zone
                },
                details: {
                    changes: {
                        old: oldData,
                        new: updatedProduct.toObject()
                    }
                },
                user: {
                    id: user?.id || 'system',
                    role: user?.role || 'system'
                }
            });
            
            eventEmitter.emitProductUpdated({
                sku,
                changes: {
                    old: oldData,
                    new: updatedProduct.toObject()
                }
            });
            
            recordInventoryOperation('updateProduct', 'success', (Date.now() - start) / 1000);
            return updatedProduct;
        } catch (error) {
            recordInventoryOperation('updateProduct', 'error', (Date.now() - start) / 1000);
            if (error.name === 'ValidationError') {
                throw new ValidationError('Datos de actualización inválidos', error.errors);
            }
            throw error;
        }
    }

    async updateStock(sku, quantity, type, user) {
        const start = Date.now();
        try {
            if (typeof quantity !== 'number' || isNaN(quantity)) {
                throw new ValidationError('Cantidad inválida', ['La cantidad debe ser un número']);
            }

            if (!['add', 'remove'].includes(type)) {
                throw new ValidationError('Tipo de operación inválido', ['El tipo debe ser "add" o "remove"']);
            }

            const product = await this.getProductBySKU(sku);
            const oldStock = product.currentStock;
            
            await product.updateStock(quantity, type);
            
            await Operation.logOperation({
                type: 'stock_update',
                product: {
                    sku: product.sku,
                    name: product.name,
                    category: product.category,
                    zone: product.zone
                },
                details: {
                    oldStock,
                    newStock: product.currentStock,
                    quantity,
                    type
                },
                user: {
                    id: user?.id || 'system',
                    role: user?.role || 'system'
                }
            });
            
            eventEmitter.emitStockUpdated({
                sku,
                oldStock,
                newStock: product.currentStock,
                type
            });

            if (product.needsReorder()) {
                eventEmitter.emitLowStock(product);
                await notificationService.notifyLowStock(product);
            }
            
            recordInventoryOperation('updateStock', 'success', (Date.now() - start) / 1000);
            return product;
        } catch (error) {
            recordInventoryOperation('updateStock', 'error', (Date.now() - start) / 1000);
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError(error.message, [error.message]);
        }
    }

    async getLowStockProducts() {
        const start = Date.now();
        try {
            const products = await Product.findLowStock();
            recordInventoryOperation('getLowStockProducts', 'success', (Date.now() - start) / 1000);
            return products || [];
        } catch (error) {
            recordInventoryOperation('getLowStockProducts', 'error', (Date.now() - start) / 1000);
            throw error;
        }
    }

    async getProductsByZone(zone) {
        const start = Date.now();
        try {
            if (!zone || typeof zone !== 'string' || !/^[A-Z][0-9]$/.test(zone)) {
                throw new ValidationError('Zona inválida', ['La zona debe tener el formato letra-número (ej: A1)']);
            }

            const products = await Product.findByZone(zone);
            recordInventoryOperation('getProductsByZone', 'success', (Date.now() - start) / 1000);
            return { zone: zone.toUpperCase(), products };
        } catch (error) {
            recordInventoryOperation('getProductsByZone', 'error', (Date.now() - start) / 1000);
            throw error;
        }
    }

    async deleteProduct(sku, user) {
        const start = Date.now();
        try {
            const product = await this.getProductBySKU(sku);
            await product.remove();
            
            await Operation.logOperation({
                type: 'delete',
                product: {
                    sku: product.sku,
                    name: product.name,
                    category: product.category,
                    zone: product.zone
                },
                user: {
                    id: user?.id || 'system',
                    role: user?.role || 'system'
                }
            });
            
            eventEmitter.emitProductDeleted(sku);
            recordInventoryOperation('deleteProduct', 'success', (Date.now() - start) / 1000);
            
            return { message: 'Producto eliminado exitosamente' };
        } catch (error) {
            recordInventoryOperation('deleteProduct', 'error', (Date.now() - start) / 1000);
            throw error;
        }
    }

    async getInventoryStats() {
        const start = Date.now();
        try {
            const stats = await Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStock: { $sum: '$currentStock' },
                        totalValue: { $sum: { $multiply: ['$price', '$currentStock'] } },
                        lowStockProducts: {
                            $sum: {
                                $cond: [{ $lte: ['$currentStock', '$reorderPoint'] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            recordInventoryOperation('getInventoryStats', 'success', (Date.now() - start) / 1000);
            return stats[0] || {
                totalProducts: 0,
                totalStock: 0,
                totalValue: 0,
                lowStockProducts: 0
            };
        } catch (error) {
            recordInventoryOperation('getInventoryStats', 'error', (Date.now() - start) / 1000);
            throw error;
        }
    }
}

module.exports = new InventoryService(); 