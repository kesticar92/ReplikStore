const mongoose = require('mongoose');

// Eliminar el modelo si ya existe
if (mongoose.models.Operation) {
    delete mongoose.models.Operation;
}

const operationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'stock_update']
    },
    product: {
        sku: String,
        name: String,
        category: String,
        zone: String
    },
    details: {
        oldStock: Number,
        newStock: Number,
        changes: mongoose.Schema.Types.Mixed
    },
    user: {
        id: String,
        role: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'error'],
        default: 'success'
    },
    error: {
        message: String,
        code: String
    }
});

// Índices para búsquedas eficientes
operationSchema.index({ timestamp: -1 });
operationSchema.index({ 'product.sku': 1 });
operationSchema.index({ type: 1 });
operationSchema.index({ 'user.id': 1 });

// Método para registrar una operación
operationSchema.statics.logOperation = async function(operationData) {
    try {
        // Asegurarse de que la estructura del producto sea correcta
        if (operationData.product) {
            operationData.product = {
                sku: operationData.product.sku,
                name: operationData.product.name,
                category: operationData.product.category,
                zone: operationData.product.zone
            };
        }
        const operation = new this(operationData);
        await operation.save();
        return operation;
    } catch (error) {
        console.error('Error al registrar operación:', error);
        throw error;
    }
};

// Método para obtener operaciones por rango de fechas
operationSchema.statics.getOperationsByDateRange = async function(startDate, endDate, options = {}) {
    const query = {
        timestamp: {
            $gte: startDate,
            $lte: endDate
        }
    };

    if (options.type) query.type = options.type;
    if (options.userId) query['user.id'] = options.userId;
    if (options.sku) query['product.sku'] = options.sku;

    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(options.limit || 100)
        .skip(options.skip || 0);
};

// Método para obtener estadísticas de operaciones
operationSchema.statics.getOperationStats = async function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                timestamp: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: {
                    type: '$type',
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        }
    ]);
};

const Operation = mongoose.model('Operation', operationSchema);

module.exports = Operation; 