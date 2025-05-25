const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    type: {
        type: String,
        required: [true, 'El tipo de reporte es requerido'],
        enum: {
            values: [
                'inventory_summary',
                'stock_movement',
                'low_stock_alert',
                'sales_analysis',
                'user_activity',
                'system_health'
            ],
            message: 'Tipo de reporte inválido'
        }
    },
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [100, 'El título no puede exceder los 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
    },
    parameters: {
        type: Map,
        of: Schema.Types.Mixed
    },
    data: {
        type: Schema.Types.Mixed,
        required: [true, 'Los datos del reporte son requeridos']
    },
    format: {
        type: String,
        enum: ['json', 'csv', 'pdf'],
        default: 'json'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    generatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario que genera el reporte es requerido']
    },
    error: {
        message: String,
        stack: String
    },
    created_at: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    completed_at: Date
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Índices para optimizar consultas comunes
reportSchema.index({ type: 1, created_at: -1 });
reportSchema.index({ generatedBy: 1, created_at: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ created_at: -1 });

// Métodos estáticos
reportSchema.statics.findByType = function(type, options = {}) {
    const query = { type };
    if (options.status) query.status = options.status;
    if (options.generatedBy) query.generatedBy = options.generatedBy;

    return this.find(query)
        .sort({ created_at: -1 })
        .populate('generatedBy', 'username email')
        .skip(options.skip || 0)
        .limit(options.limit || 20);
};

reportSchema.statics.findByUser = function(userId, options = {}) {
    const query = { generatedBy: userId };
    if (options.type) query.type = options.type;
    if (options.status) query.status = options.status;

    return this.find(query)
        .sort({ created_at: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20);
};

// Método para generar reporte
reportSchema.statics.generateReport = async function(data) {
    const report = new this(data);
    await report.save();
    return report;
};

// Middleware para actualizar completed_at cuando el estado cambia a completed
reportSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'completed' && !this.completed_at) {
        this.completed_at = new Date();
    }
    next();
});

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema); 