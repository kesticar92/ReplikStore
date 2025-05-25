const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');

/**
 * @swagger
 * /audit/activity:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener actividad reciente
 *     description: Retorna una lista paginada de eventos de auditoría
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
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de acción
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de entidad
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de actividad obtenida exitosamente
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
 *                     activity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Audit'
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
router.get('/activity',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    auditController.getRecentActivity
);

/**
 * @swagger
 * /audit/entity/{entity}/{entityId}:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener historial de entidad
 *     description: Retorna el historial completo de una entidad específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de entidad
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la entidad
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audit'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Historial no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/entity/:entity/:entityId',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    auditController.getEntityHistory
);

/**
 * @swagger
 * /audit/user/{userId}:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener actividad de usuario
 *     description: Retorna la actividad de un usuario específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
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
 *         description: Cantidad de registros por página
 *     responses:
 *       200:
 *         description: Actividad de usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audit'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/user/:userId',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    auditController.getUserActivity
);

/**
 * @swagger
 * /audit/export:
 *   get:
 *     tags: [Auditoría]
 *     summary: Exportar registros de auditoría
 *     description: Exporta los registros de auditoría en formato JSON
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de entidad
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de acción
 *     responses:
 *       200:
 *         description: Registros exportados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audit'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    auditController.exportAuditLogs
);

/**
 * @swagger
 * /audit/stats:
 *   get:
 *     tags: [Auditoría]
 *     summary: Obtener estadísticas de auditoría
 *     description: Retorna estadísticas sobre los registros de auditoría
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                     totalEvents:
 *                       type: integer
 *                     eventsByType:
 *                       type: object
 *                     eventsByEntity:
 *                       type: object
 *                     eventsByStatus:
 *                       type: object
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    auditController.getAuditStats
);

module.exports = router; 