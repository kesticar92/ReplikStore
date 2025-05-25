const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre del producto es requerido'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
    },
    sku: {
        type: String,
        required: [true, 'El SKU es requerido'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9-]+$/, 'El SKU solo puede contener letras mayúsculas, números y guiones']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder los 1000 caracteres']
    },
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo'],
        get: v => Math.round(v * 100) / 100
    },
    currentStock: {
        type: Number,
        required: [true, 'El stock actual es requerido'],
        min: [0, 'El stock no puede ser negativo'],
        default: 0
    },
    minStock: {
        type: Number,
        required: [true, 'El stock mínimo es requerido'],
        min: [0, 'El stock mínimo no puede ser negativo']
    },
    maxStock: {
        type: Number,
        required: [true, 'El stock máximo es requerido'],
        min: [0, 'El stock máximo no puede ser negativo']
    },
    reorderPoint: {
        type: Number,
        required: [true, 'El punto de reorden es requerido'],
        min: [0, 'El punto de reorden no puede ser negativo']
    },
    category: {
        type: String,
        required: [true, 'La categoría es requerida'],
        trim: true
    },
    zone: {
        type: String,
        required: [true, 'La zona es requerida'],
        trim: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'discontinued'],
            message: 'El estado debe ser active, inactive o discontinued'
        },
        default: 'active'
    },
    image_url: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'La URL de la imagen debe ser válida'
        }
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    },
    created_at: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ zone: 1 });
productSchema.index({ status: 1 });
productSchema.index({ currentStock: 1 });

productSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

productSchema.statics.findBySKU = function(sku) {
    return this.findOne({ sku: sku.toUpperCase() });
};

productSchema.statics.findLowStock = function() {
    return this.find({
        $expr: {
            $lte: ['$currentStock', '$reorderPoint']
        }
    });
};

productSchema.statics.findByZone = function(zone) {
    return this.find({ zone: zone.toUpperCase() });
};

productSchema.methods.updateStock = async function(quantity, type) {
    if (type === 'add') {
        this.currentStock += quantity;
    } else if (type === 'remove') {
        if (this.currentStock < quantity) {
            throw new Error('Stock insuficiente');
        }
        this.currentStock -= quantity;
    }
    return this.save();
};

productSchema.methods.needsReorder = function() {
    return this.currentStock <= this.reorderPoint;
};

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema); 