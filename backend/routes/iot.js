const express = require('express');
const router = express.Router();
const promClient = require('prom-client');

// Métricas para sensores
const sensorReadingsGauge = new promClient.Gauge({
    name: 'sensor_reading_value',
    help: 'Valor actual del sensor',
    labelNames: ['sensor_id', 'type']
});

const sensorStatusGauge = new promClient.Gauge({
    name: 'sensor_status',
    help: 'Estado del sensor (1: activo, 0: inactivo)',
    labelNames: ['sensor_id']
});

// Websocket para actualizaciones en tiempo real
let connectedClients = new Set();

router.post('/sensor-data', async (req, res) => {
    const { sensorId, type, value, timestamp } = req.body;
    
    // Actualizar métricas
    sensorReadingsGauge.labels(sensorId, type).set(value);
    sensorStatusGauge.labels(sensorId).set(1);

    // Notificar a clientes conectados
    connectedClients.forEach(client => {
        client.send(JSON.stringify({ sensorId, type, value, timestamp }));
    });

    res.json({ status: 'ok' });
});

router.get('/sensors/:id/history', async (req, res) => {
    const { id } = req.params;
    // TODO: Implementar consulta de histórico desde base de datos
    res.json([]);
});

router.post('/sensors/register', async (req, res) => {
    const { sensorId, type, location } = req.body;
    // TODO: Implementar registro de sensores en base de datos
    res.status(201).json({ message: 'Sensor registrado exitosamente' });
});

module.exports = {
    router,
    connectedClients
}; 