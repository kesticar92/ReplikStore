const WebSocket = require('ws');
const { logger } = require('../utils/logger');
const { Notification } = require('../models/notification');
const { User } = require('../models/user');

class NotificationService {
    constructor() {
        this.clients = new Map(); // Map<userId, WebSocket>
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        this.wss = new WebSocket.Server({ noServer: true });
        
        this.wss.on('connection', (ws, req) => {
            const userId = req.user._id;
            this.clients.set(userId.toString(), ws);

            ws.on('close', () => {
                this.clients.delete(userId.toString());
            });

            // Enviar notificaciones pendientes al conectar
            this.sendPendingNotifications(userId);
        });
    }

    async createNotification(data) {
        try {
            const notification = new Notification({
                type: data.type,
                title: data.title,
                message: data.message,
                level: data.level || 'info',
                metadata: data.metadata || {},
                recipients: data.recipients || [],
                readBy: []
            });

            await notification.save();
            logger.info('Notificación creada:', { id: notification._id, type: data.type });

            // Notificar a los clientes conectados
            this.broadcastNotification(notification);

            return notification;
        } catch (error) {
            logger.error('Error al crear notificación:', error);
            throw error;
        }
    }

    async sendPendingNotifications(userId) {
        try {
            const notifications = await Notification.find({
                recipients: userId,
                readBy: { $ne: userId }
            }).sort({ createdAt: -1 }).limit(10);

            const ws = this.clients.get(userId.toString());
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'pending_notifications',
                    data: notifications
                }));
            }
        } catch (error) {
            logger.error('Error al enviar notificaciones pendientes:', error);
        }
    }

    broadcastNotification(notification) {
        const message = JSON.stringify({
            type: 'notification',
            data: notification
        });

        notification.recipients.forEach(recipientId => {
            const ws = this.clients.get(recipientId.toString());
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findById(notificationId);
            if (!notification) {
                throw new Error('Notificación no encontrada');
            }

            if (!notification.readBy.includes(userId)) {
                notification.readBy.push(userId);
                await notification.save();
            }

            return notification;
        } catch (error) {
            logger.error('Error al marcar notificación como leída:', error);
            throw error;
        }
    }

    async getNotifications(userId, options = {}) {
        try {
            const query = {
                recipients: userId
            };

            if (options.unreadOnly) {
                query.readBy = { $ne: userId };
            }

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(options.skip || 0)
                .limit(options.limit || 20);

            const total = await Notification.countDocuments(query);

            return {
                notifications,
                total,
                page: Math.floor((options.skip || 0) / (options.limit || 20)) + 1,
                pages: Math.ceil(total / (options.limit || 20))
            };
        } catch (error) {
            logger.error('Error al obtener notificaciones:', error);
            throw error;
        }
    }

    // Métodos específicos para diferentes tipos de notificaciones
    async notifyLowStock(product) {
        const admins = await User.find({ role: 'admin' });
        const adminIds = admins.map(admin => admin._id);

        return this.createNotification({
            type: 'low_stock',
            title: 'Stock Bajo',
            message: `El producto ${product.name} (${product.sku}) tiene stock bajo (${product.currentStock} unidades)`,
            level: 'warning',
            metadata: {
                productId: product._id,
                sku: product.sku,
                currentStock: product.currentStock,
                minStock: product.minStock
            },
            recipients: adminIds
        });
    }

    async notifyStockUpdate(product, movement) {
        const admins = await User.find({ role: 'admin' });
        const adminIds = admins.map(admin => admin._id);

        return this.createNotification({
            type: 'stock_update',
            title: 'Actualización de Stock',
            message: `Se ha ${movement.type === 'in' ? 'agregado' : 'retirado'} ${movement.quantity} unidades de ${product.name}`,
            level: 'info',
            metadata: {
                productId: product._id,
                sku: product.sku,
                movementId: movement._id,
                quantity: movement.quantity,
                type: movement.type
            },
            recipients: adminIds
        });
    }

    async notifyInventoryAlert(message, level = 'warning') {
        const admins = await User.find({ role: 'admin' });
        const adminIds = admins.map(admin => admin._id);

        return this.createNotification({
            type: 'inventory_alert',
            title: 'Alerta de Inventario',
            message,
            level,
            recipients: adminIds
        });
    }
}

// Exportar una instancia única del servicio
module.exports = new NotificationService(); 