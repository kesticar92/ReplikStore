const auditService = require('../services/auditService');
const { catchAsync } = require('../utils/catchAsync');
const { logger } = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

const auditController = {
    getRecentActivity: catchAsync(async (req, res) => {
        const { page = 1, limit = 20, action, entity, status } = req.query;
        const skip = (page - 1) * limit;

        const result = await auditService.getRecentActivity({
            skip,
            limit: parseInt(limit),
            action,
            entity,
            status
        });

        res.json({
            success: true,
            data: result
        });
    }),

    getEntityHistory: catchAsync(async (req, res) => {
        const { entity, entityId } = req.params;

        const history = await auditService.getEntityHistory(entity, entityId);
        if (!history || history.length === 0) {
            throw new NotFoundError('No se encontró historial para esta entidad');
        }

        res.json({
            success: true,
            data: history
        });
    }),

    getUserActivity: catchAsync(async (req, res) => {
        const { userId } = req.params;
        const { page = 1, limit = 20, action, entity, status } = req.query;
        const skip = (page - 1) * limit;

        const activity = await auditService.getUserActivity(userId, {
            skip,
            limit: parseInt(limit),
            action,
            entity,
            status
        });

        res.json({
            success: true,
            data: activity
        });
    }),

    // Método para exportar registros de auditoría
    exportAuditLogs: catchAsync(async (req, res) => {
        const { startDate, endDate, entity, action } = req.query;
        
        const query = {};
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (entity) query.entity = entity;
        if (action) query.action = action;

        const logs = await auditService.exportLogs(query);

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');

        res.json({
            success: true,
            data: logs
        });
    }),

    // Método para obtener estadísticas de auditoría
    getAuditStats: catchAsync(async (req, res) => {
        const { startDate, endDate } = req.query;
        
        const query = {};
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await auditService.getStats(query);

        res.json({
            success: true,
            data: stats
        });
    })
};

module.exports = auditController; 