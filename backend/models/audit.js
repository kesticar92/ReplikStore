const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditSchema = new Schema({
    action: {
        type: String,
        required: [true, 'La acción es requerida'],
        enum: {
            values: [
                'create', 'update', 'delete', 'login', 'logout',
                'stock_update', 'inventory_movement', 'notification_sent',
                'report_generated', 'user_action', 'system_event'
            ],
            message: 'Tipo de acción inválida'
        }
    },
    entity: {
        type: String,
        required: [true, 'La entidad es requerida'],
        enum: {
            values: ['user', 'product', 'inventory', 'notification', 'report', 'system'],
            message: 'Tipo de entidad inválida'
        }
    },
    entityId: {
        type: Schema.Types.ObjectId,
        required: [true, 'El ID de la entidad es requerido']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es requerido']
    },
    changes: {
        before: Schema.Types.Mixed,
        after: Schema.Types.Mixed
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    },
    ip: {
        type: String,
        required: [true, 'La dirección IP es requerida']
    },
    userAgent: {
        type: String,
        required: [true, 'El User-Agent es requerido']
    },
    status: {
        type: String,
        enum: ['success', 'failure', 'warning'],
        default: 'success'
    },
    message: {
        type: String,
        trim: true,
        maxlength: [500, 'El mensaje no puede exceder los 500 caracteres']
    },
    created_at: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Índices para optimizar consultas comunes
auditSchema.index({ action: 1, created_at: -1 });
auditSchema.index({ entity: 1, entityId: 1 });
auditSchema.index({ user: 1, created_at: -1 });
auditSchema.index({ status: 1 });
auditSchema.index({ created_at: -1 });

// Métodos estáticos
auditSchema.statics.findByEntity = function(entity, entityId) {
    return this.find({ entity, entityId })
        .sort({ created_at: -1 })
        .populate('user', 'username email');
};

auditSchema.statics.findByUser = function(userId, options = {}) {
    const query = { user: userId };
    if (options.action) query.action = options.action;
    if (options.entity) query.entity = options.entity;
    if (options.status) query.status = options.status;

    return this.find(query)
        .sort({ created_at: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20);
};

auditSchema.statics.getEntityHistory = async function(entity, entityId) {
    return this.find({ entity, entityId })
        .sort({ created_at: -1 })
        .populate('user', 'username email')
        .lean();
};

// Método para registrar cambios en documentos
auditSchema.statics.logChanges = async function(data) {
    const audit = new this(data);
    await audit.save();
    return audit;
};

// Middleware para limpiar datos sensibles antes de guardar
auditSchema.pre('save', function(next) {
    if (this.changes) {
        // Limpiar datos sensibles
        const sensitiveFields = ['password', 'token', 'secret'];
        
        if (this.changes.before) {
            sensitiveFields.forEach(field => {
                if (this.changes.before[field]) {
                    this.changes.before[field] = '[REDACTED]';
                }
            });
        }
        
        if (this.changes.after) {
            sensitiveFields.forEach(field => {
                if (this.changes.after[field]) {
                    this.changes.after[field] = '[REDACTED]';
                }
            });
        }
    }
    next();
});

module.exports = mongoose.models.Audit || mongoose.model('Audit', auditSchema); 