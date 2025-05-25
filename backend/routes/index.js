const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const sensorRoutes = require('./sensors');
const inventoryRoutes = require('./inventory');
const analyticsRoutes = require('./analytics');
const monitoringRoutes = require('./monitoring');

const setupRoutes = (app) => {
    // Rutas de autenticación
    app.use('/api/auth', authRoutes);

    // Rutas de sensores
    app.use('/api/sensors', sensorRoutes);

    // Rutas de inventario
    app.use('/api/inventory', inventoryRoutes);

    // Rutas de análisis
    app.use('/api/analytics', analyticsRoutes);

    // Rutas de monitoreo
    app.use('/api/monitoring', monitoringRoutes);

    // Ruta de health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date(),
            version: process.env.APP_VERSION || '1.0.0'
        });
    });
};

module.exports = router; 