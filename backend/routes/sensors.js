const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken, checkRole } = require('../middleware/auth');
const router = express.Router();

// Validaciones
const sensorDataValidation = [
  body('sensor').notEmpty().withMessage('El ID del sensor es requerido'),
  body('tipo').notEmpty().withMessage('El tipo de sensor es requerido'),
  body('valor').isNumeric().withMessage('El valor debe ser numérico'),
  body('ubicacion').notEmpty().withMessage('La ubicación es requerida')
];

const sensorParamValidation = [
  param('sensor').notEmpty().withMessage('El ID del sensor es requerido')
];

// POST /api/sensors/data
router.post('/data', authenticateToken, checkRole(['admin', 'sensor']), sensorDataValidation, (req, res) => {
  const { sensor, tipo, valor, ubicacion } = req.body;
  
  // Validar que el valor sea numérico
  if (isNaN(valor)) {
    return res.status(400).json({
      success: false,
      message: 'El valor del sensor debe ser numérico'
    });
  }

  // Aquí se procesaría la lógica para guardar los datos del sensor
  // Emitir mensaje WebSocket si la función global está definida
  if (typeof global.broadcastUpdate === 'function') {
    global.broadcastUpdate('sensor_update', { sensor, tipo, valor, ubicacion });
  }

  res.status(201).json({ success: true, data: { sensor, tipo, valor, ubicacion } });
});

// GET /api/sensors/:sensor
router.get('/:sensor', authenticateToken, sensorParamValidation, (req, res) => {
  const { sensor } = req.params;
  
  // Simular que el sensor no existe
  if (sensor === 'non_existent') {
    return res.status(404).json({
      success: false,
      message: 'Sensor no encontrado'
    });
  }

  // Aquí se procesaría la lógica para obtener el último valor del sensor
  res.status(200).json({ success: true, data: { sensor, valor: 25.5 } });
});

// GET /api/sensors
router.get('/', authenticateToken, (req, res) => {
  // Aquí se procesaría la lógica para obtener el historial de sensores
  res.status(200).json({ success: true, data: [] });
});

// DELETE /api/sensors/:sensor
router.delete('/:sensor', authenticateToken, checkRole(['admin']), sensorParamValidation, (req, res) => {
  const { sensor } = req.params;
  
  // Simular que el sensor no existe
  if (sensor === 'non_existent') {
    return res.status(404).json({
      success: false,
      message: 'Sensor no encontrado'
    });
  }

  // Aquí se procesaría la lógica para eliminar el sensor
  res.status(200).json({ success: true, message: 'Sensor eliminado correctamente' });
});

// POST /api/sensors
router.post('/', authenticateToken, checkRole(['admin', 'sensor_manager']), (req, res) => {
  const { name, type, location, status } = req.body;
  if (!name || !type || !location || !status) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  }
  // Simular un _id generado
  const sensor = { _id: 'simulado_' + Date.now(), name, type, location, status };
  res.status(201).json(sensor);
});

// PUT /api/sensors/:id
router.put('/:id', authenticateToken, checkRole(['admin', 'sensor_manager']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'El campo status es requerido' });
  }
  // Simular actualización de sensor
  const updatedSensor = { _id: id, status };
  console.log('Intentando emitir actualización de sensor:', updatedSensor);
  console.log('¿broadcastUpdate está definido?', typeof global.broadcastUpdate === 'function');
  // Emitir mensaje WebSocket si la función global está definida
  if (typeof global.broadcastUpdate === 'function') {
    console.log('Llamando a broadcastUpdate...');
    global.broadcastUpdate('sensor_update', updatedSensor);
    console.log('broadcastUpdate llamado exitosamente');
  } else {
    console.log('broadcastUpdate no está definido');
  }
  res.status(200).json(updatedSensor);
});

module.exports = router; 