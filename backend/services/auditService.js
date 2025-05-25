const Audit = require('../models/audit');
const { logger } = require('../utils/logger');

class AuditService {
    async logEvent(data) {
        try {
            const audit = await Audit.logChanges(data);
            logger.info('Evento de auditoría registrado:', {
                id: audit._id,
                action: audit.action,
                entity: audit.entity
            });
            return audit;
        } catch (error) {
            logger.error('Error al registrar evento de auditoría:', error);
            throw error;
        }
    }

    async logUserAction(userId, action, entity, entityId, changes = {}, metadata = {}) {
        return this.logEvent({
            action,
            entity,
            entityId,
            user: userId,
            changes,
            metadata,
            status: 'success'
        });
    }

    async logSystemEvent(action, entity, entityId, message, metadata = {}) {
        return this.logEvent({
            action,
            entity,
            entityId,
            user: null, // Evento del sistema
            message,
            metadata,
            status: 'success'
        });
    }

    async logError(action, entity, entityId, error, userId = null) {
        return this.logEvent({
            action,
            entity,
            entityId,
            user: userId,
            message: error.message,
            metadata: {
                error: {
                    name: error.name,
                    stack: error.stack
                }
            },
            status: 'failure'
        });
    }

    async getEntityHistory(entity, entityId) {
        try {
            const history = await Audit.getEntityHistory(entity, entityId);
            return history;
        } catch (error) {
            logger.error('Error al obtener historial de entidad:', error);
            throw error;
        }
    }

    async getUserActivity(userId, options = {}) {
        try {
            const activity = await Audit.findByUser(userId, options);
            return activity;
        } catch (error) {
            logger.error('Error al obtener actividad de usuario:', error);
            throw error;
        }
    }

    async getRecentActivity(options = {}) {
        try {
            const query = {};
            if (options.action) query.action = options.action;
            if (options.entity) query.entity = options.entity;
            if (options.status) query.status = options.status;

            const activity = await Audit.find(query)
                .sort({ created_at: -1 })
                .skip(options.skip || 0)
                .limit(options.limit || 20)
                .populate('user', 'username email');

            const total = await Audit.countDocuments(query);

            return {
                activity,
                total,
                page: Math.floor((options.skip || 0) / (options.limit || 20)) + 1,
                pages: Math.ceil(total / (options.limit || 20))
            };
        } catch (error) {
            logger.error('Error al obtener actividad reciente:', error);
            throw error;
        }
    }

    // Métodos específicos para diferentes tipos de eventos
    async logProductChange(userId, productId, action, changes) {
        return this.logUserAction(
            userId,
            action,
            'product',
            productId,
            changes,
            { productId }
        );
    }

    async logInventoryMovement(userId, inventoryId, action, changes) {
        return this.logUserAction(
            userId,
            action,
            'inventory',
            inventoryId,
            changes,
            { inventoryId }
        );
    }

    async logUserLogin(userId, ip, userAgent) {
        return this.logUserAction(
            userId,
            'login',
            'user',
            userId,
            {},
            { ip, userAgent }
        );
    }

    async logUserLogout(userId) {
        return this.logUserAction(
            userId,
            'logout',
            'user',
            userId
        );
    }

    async logNotificationSent(notificationId, userId, recipients) {
        return this.logUserAction(
            userId,
            'notification_sent',
            'notification',
            notificationId,
            {},
            { recipients }
        );
    }
}

module.exports = new AuditService(); 