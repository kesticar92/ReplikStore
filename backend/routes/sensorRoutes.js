const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// Middleware de verificación de roles
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }
        
        if (!roles.includes(req.auth.role)) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para esta operación'
            });
        }
        next();
    };
};

// Rutas de sensores
router.get('/all', checkRole(['admin', 'operator', 'viewer']), sensorController.getAllSensorData);
router.get('/:sensor', checkRole(['admin', 'operator', 'viewer']), sensorController.getLastSensorValue);
router.post('/data', checkRole(['admin', 'operator']), sensorController.receiveSensorData);
router.put('/:sensor', checkRole(['admin', 'operator']), sensorController.updateSensorData);
router.delete('/:sensor', checkRole(['admin']), sensorController.deleteSensorData);

module.exports = router;
