const notificationService = require('../services/notificationService');
const { catchAsync } = require('../utils/catchAsync');
const { logger } = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

const notificationController = {
    getNotifications: catchAsync(async (req, res) => {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const skip = (page - 1) * limit;

        const result = await notificationService.getNotifications(req.user._id, {
            skip,
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true'
        });

        res.json({
            success: true,
            data: result
        });
    }),

    markAsRead: catchAsync(async (req, res) => {
        const notification = await notificationService.markAsRead(
            req.params.id,
            req.user._id
        );

        res.json({
            success: true,
            data: notification
        });
    }),

    markAllAsRead: catchAsync(async (req, res) => {
        await notificationService.markAllAsRead(req.user._id);

        res.json({
            success: true,
            message: 'Todas las notificaciones han sido marcadas como leídas'
        });
    }),

    getUnreadCount: catchAsync(async (req, res) => {
        const count = await notificationService.getUnreadCount(req.user._id);

        res.json({
            success: true,
            data: { count }
        });
    }),

    // Métodos para pruebas y desarrollo
    createTestNotification: catchAsync(async (req, res) => {
        const { type, title, message, level } = req.body;

        const notification = await notificationService.createNotification({
            type,
            title,
            message,
            level,
            recipients: [req.user._id]
        });

        res.status(201).json({
            success: true,
            data: notification
        });
    }),

    // WebSocket connection handler
    handleWebSocketConnection: (ws, req) => {
        notificationService.handleConnection(ws, req);
    }
};

module.exports = notificationController; 