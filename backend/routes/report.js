const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');

/**
 * @swagger
 * /reports:
 *   post:
 *     tags: [Reportes]
 *     summary: Generar un nuevo reporte
 *     description: Crea y procesa un nuevo reporte según el tipo y parámetros especificados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [inventory_summary, stock_movement, low_stock_alert, sales_analysis, user_activity, system_health]
 *                 description: Tipo de reporte a generar
 *               parameters:
 *                 type: object
 *                 description: Parámetros específicos para el tipo de reporte
 *     responses:
 *       201:
 *         description: Reporte generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/',
    authMiddleware.verifyToken,
    validation.validateReportGeneration,
    reportController.generateReport
);

/**
 * @swagger
 * /reports:
 *   get:
 *     tags: [Reportes]
 *     summary: Obtener lista de reportes
 *     description: Retorna una lista paginada de reportes generados
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
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de reporte
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado del reporte
 *     responses:
 *       200:
 *         description: Lista de reportes obtenida exitosamente
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
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Report'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/',
    authMiddleware.verifyToken,
    reportController.getReports
);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     tags: [Reportes]
 *     summary: Obtener reporte por ID
 *     description: Retorna los detalles de un reporte específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Reporte no encontrado
 */
router.get('/:id',
    authMiddleware.verifyToken,
    reportController.getReportById
);

/**
 * @swagger
 * /reports/{id}/download:
 *   get:
 *     tags: [Reportes]
 *     summary: Descargar reporte
 *     description: Descarga el reporte en el formato especificado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del reporte
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *         description: Formato de descarga
 *     responses:
 *       200:
 *         description: Reporte descargado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Reporte no encontrado
 */
router.get('/:id/download',
    authMiddleware.verifyToken,
    reportController.downloadReport
);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     tags: [Reportes]
 *     summary: Eliminar reporte
 *     description: Elimina un reporte específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte eliminado exitosamente
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
 *                   example: Reporte eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Reporte no encontrado
 */
router.delete('/:id',
    authMiddleware.verifyToken,
    reportController.deleteReport
);

module.exports = router; 