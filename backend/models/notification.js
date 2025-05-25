const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    type: {
        type: String,
        required: [true, 'El tipo de notificación es requerido'],
        enum: {
            values: ['low_stock', 'stock_update', 'inventory_alert', 'system_alert'],
            message: 'Tipo de notificación inválido'
        }
    },
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [100, 'El título no puede exceder los 100 caracteres']
    },
    message: {
        type: String,
        required: [true, 'El mensaje es requerido'],
        trim: true,
        maxlength: [500, 'El mensaje no puede exceder los 500 caracteres']
    },
    level: {
        type: String,
        enum: {
            values: ['info', 'warning', 'error', 'success'],
            message: 'Nivel de notificación inválido'
        },
        default: 'info'
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    },
    recipients: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Los destinatarios son requeridos']
    }],
    readBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
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
notificationSchema.index({ type: 1 });
notificationSchema.index({ level: 1 });
notificationSchema.index({ recipients: 1 });
notificationSchema.index({ readBy: 1 });
notificationSchema.index({ created_at: -1 });

// Métodos estáticos
notificationSchema.statics.findUnreadByUser = function(userId) {
    return this.find({
        recipients: userId,
        readBy: { $ne: userId }
    }).sort({ created_at: -1 });
};

notificationSchema.statics.markAllAsRead = async function(userId) {
    return this.updateMany(
        {
            recipients: userId,
            readBy: { $ne: userId }
        },
        {
            $addToSet: { readBy: userId }
        }
    );
};

// Métodos de instancia
notificationSchema.methods.markAsRead = async function(userId) {
    if (!this.readBy.includes(userId)) {
        this.readBy.push(userId);
        await this.save();
    }
    return this;
};

// Middleware
notificationSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema); 