const express = require('express');
const router = express.Router();
const { getMetrics } = require('../utils/metrics');
const { checkRole } = require('../middleware/security');
const inventoryService = require('../services/inventoryService');

// Ruta para obtener métricas de Prometheus
router.get('/metrics', checkRole(['admin', 'monitor']), async (req, res) => {
    try {
        const metrics = await getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
});

// Ruta para obtener estadísticas del sistema
router.get('/stats', checkRole(['admin', 'monitor']), async (req, res) => {
    try {
        const [inventoryStats, lowStockCount] = await Promise.all([
            inventoryService.getInventoryStats(),
            inventoryService.getLowStockProducts().then(products => products.length)
        ]);

        const stats = {
            inventory: inventoryStats,
            alerts: {
                lowStock: lowStockCount
            },
            timestamp: new Date()
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Ruta para obtener productos con stock bajo
router.get('/alerts/low-stock', checkRole(['admin', 'monitor']), async (req, res) => {
    try {
        const lowStockProducts = await inventoryService.getLowStockProducts();
        res.json(lowStockProducts);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos con stock bajo' });
    }
});

// Ruta para obtener estadísticas por zona
router.get('/stats/zone/:zone', checkRole(['admin', 'monitor']), async (req, res) => {
    try {
        const products = await inventoryService.getProductsByZone(req.params.zone);
        const stats = {
            zone: req.params.zone,
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + p.currentStock, 0),
            totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.price), 0),
            lowStockProducts: products.filter(p => p.currentStock <= p.reorderPoint).length
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas de zona' });
    }
});

// Ruta para obtener historial de operaciones
router.get('/operations', checkRole(['admin', 'monitor']), async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        if (type) {
            query.type = type;
        }

        const operations = await Operation.find(query)
            .sort({ timestamp: -1 })
            .limit(100);

        res.json(operations);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial de operaciones' });
    }
});

module.exports = router; 