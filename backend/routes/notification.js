const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Obtener notificaciones del usuario
 *     description: Retorna una lista paginada de notificaciones para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de notificaciones por página
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filtrar solo notificaciones no leídas
 *     responses:
 *       200:
 *         description: Lista de notificaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/',
    authMiddleware.verifyToken,
    notificationController.getNotifications
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notificaciones]
 *     summary: Marcar notificación como leída
 *     description: Marca una notificación específica como leída para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/read',
    authMiddleware.verifyToken,
    notificationController.markAsRead
);

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     tags: [Notificaciones]
 *     summary: Marcar todas las notificaciones como leídas
 *     description: Marca todas las notificaciones no leídas como leídas para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las notificaciones han sido marcadas como leídas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Todas las notificaciones han sido marcadas como leídas
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/read-all',
    authMiddleware.verifyToken,
    notificationController.markAllAsRead
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Obtener contador de notificaciones no leídas
 *     description: Retorna el número de notificaciones no leídas para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contador obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/unread-count',
    authMiddleware.verifyToken,
    notificationController.getUnreadCount
);

// Ruta para pruebas (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    router.post('/test',
        authMiddleware.verifyToken,
        validation.validateRequest({
            body: {
                type: { type: 'string', required: true, enum: ['low_stock', 'stock_update', 'inventory_alert', 'system_alert'] },
                title: { type: 'string', required: true },
                message: { type: 'string', required: true },
                level: { type: 'string', required: false, enum: ['info', 'warning', 'error', 'success'] }
            }
        }),
        notificationController.createTestNotification
    );
}

module.exports = router; 