const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es requerido']
    },
    quantity: {
        type: Number,
        required: [true, 'La cantidad es requerida'],
        min: [0, 'La cantidad no puede ser negativa']
    },
    type: {
        type: String,
        enum: {
            values: ['in', 'out', 'adjustment', 'return'],
            message: 'El tipo debe ser in, out, adjustment o return'
        },
        required: [true, 'El tipo de movimiento es requerido']
    },
    reference: {
        type: String,
        required: [true, 'La referencia es requerida'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'La ubicación es requerida'],
        trim: true,
        uppercase: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder los 500 caracteres']
    },
    operator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El operador es requerido']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'completed', 'cancelled'],
            message: 'El estado debe ser pending, completed o cancelled'
        },
        default: 'pending'
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

// Índices
inventorySchema.index({ product: 1, created_at: -1 });
inventorySchema.index({ type: 1 });
inventorySchema.index({ location: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ reference: 1 }, { unique: true });

// Middleware pre-save
inventorySchema.pre('save', async function(next) {
    this.updated_at = new Date();
    
    // Actualizar el stock del producto
    if (this.isModified('quantity') || this.isModified('type')) {
        const Product = mongoose.model('Product');
        const product = await Product.findById(this.product);
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }

        let stockChange = this.quantity;
        if (this.type === 'out' || this.type === 'return') {
            stockChange = -stockChange;
        }

        await product.updateStock(stockChange);
    }
    
    next();
});

// Métodos estáticos
inventorySchema.statics.findByProduct = function(productId) {
    return this.find({ product: productId })
        .sort({ created_at: -1 })
        .populate('product', 'name sku')
        .populate('operator', 'name email');
};

inventorySchema.statics.findByLocation = function(location) {
    return this.find({ location: location.toUpperCase() })
        .sort({ created_at: -1 })
        .populate('product', 'name sku')
        .populate('operator', 'name email');
};

inventorySchema.statics.findByReference = function(reference) {
    return this.findOne({ reference })
        .populate('product', 'name sku')
        .populate('operator', 'name email');
};

// Métodos de instancia
inventorySchema.methods.cancel = async function() {
    if (this.status === 'completed') {
        const Product = mongoose.model('Product');
        const product = await Product.findById(this.product);
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }

        let stockChange = -this.quantity;
        if (this.type === 'out' || this.type === 'return') {
            stockChange = -stockChange;
        }

        await product.updateStock(stockChange);
    }
    
    this.status = 'cancelled';
    return this.save();
};

inventorySchema.methods.complete = async function() {
    if (this.status === 'pending') {
        this.status = 'completed';
        return this.save();
    }
    throw new Error('Solo los movimientos pendientes pueden ser completados');
};

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema); 