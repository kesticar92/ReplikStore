const { ValidationError } = require('../utils/errors');

const validateProduct = (req, res, next) => {
    const { name, sku, price, currentStock, minStock, maxStock, reorderPoint, category, zone } = req.body;
    const errors = [];
    if (!name || name.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    if (!sku || !/^[A-Z0-9-]+$/.test(sku)) {
        errors.push('El SKU debe contener solo letras mayúsculas, números y guiones');
    }
    if (price === undefined || price < 0) {
        errors.push('El precio debe ser un número positivo');
    }
    if (currentStock === undefined || currentStock < 0) {
        errors.push('El stock actual debe ser un número positivo');
    }
    if (minStock === undefined || minStock < 0) {
        errors.push('El stock mínimo debe ser un número positivo');
    }
    if (maxStock === undefined || maxStock < 0) {
        errors.push('El stock máximo debe ser un número positivo');
    }
    if (minStock > maxStock) {
        errors.push('El stock mínimo no puede ser mayor que el stock máximo');
    }
    if (reorderPoint === undefined || reorderPoint < 0) {
        errors.push('El punto de reorden debe ser un número positivo');
    }
    if (!category) {
        errors.push('La categoría es requerida');
    }
    if (!zone || !/^[A-Z][0-9]$/.test(zone)) {
        errors.push('La zona debe tener el formato letra-número (ej: A1)');
    }
    if (errors.length > 0) {
        return next(new ValidationError('Datos de producto inválidos', errors));
    }
    next();
};

const validateStockUpdate = (req, res, next) => {
    const { quantity, type } = req.body;
    const errors = [];
    if (quantity === undefined || typeof quantity !== 'number') {
        errors.push('La cantidad debe ser un número');
    }
    if (!type || !['sale', 'purchase'].includes(type)) {
        errors.push('El tipo debe ser "sale" o "purchase"');
    }
    if (errors.length > 0) {
        return next(new ValidationError('Datos de actualización de stock inválidos', errors));
    }
    next();
};

module.exports = {
    validateProduct,
    validateStockUpdate
}; 