const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');

// Conexión a la base de datos
const db = new sqlite3.Database(path.join(__dirname, '../data/sensors.db'), (err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
    } else {
        console.log('Conexión exitosa con la base de datos SQLite');
        // Crear tabla de sensores si no existe
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor TEXT NOT NULL,
                tipo TEXT NOT NULL,
                valor REAL NOT NULL,
                ubicacion TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Crear índices para mejorar el rendimiento
            db.run('CREATE INDEX IF NOT EXISTS idx_sensor ON sensor_data(sensor)');
            db.run('CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_data(timestamp)');
            db.run('CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_data(sensor, timestamp)');
        });
    }
});

const handleDatabaseError = (res, operation, err) => {
    console.error(`Error en operación ${operation}:`, err);
    return res.status(500).json({
        success: false,
        message: `Error al ${operation}`,
        error: err.message,
        timestamp: new Date().toISOString()
    });
};

const sensorController = {
    // Obtener todos los datos de sensores
    getAllSensorData: (req, res) => {
        db.all('SELECT * FROM sensor_data ORDER BY timestamp DESC', [], (err, rows) => {
            if (err) {
                return handleDatabaseError(res, 'obtener datos de sensores', err);
            }
            res.status(200).json({
                success: true,
                data: rows,
                timestamp: new Date().toISOString()
            });
        });
    },

    // Obtener último valor de un sensor
    getLastSensorValue: (req, res) => {
        const { sensor } = req.params;
        db.get('SELECT * FROM sensor_data WHERE sensor = ? ORDER BY timestamp DESC LIMIT 1', [sensor], (err, row) => {
            if (err) {
                return handleDatabaseError(res, 'obtener datos del sensor', err);
            }
            if (!row) {
                return res.status(404).json({
                    success: false,
                    message: 'Sensor no encontrado',
                    timestamp: new Date().toISOString()
                });
            }
            res.status(200).json({
                success: true,
                data: row,
                timestamp: new Date().toISOString()
            });
        });
    },

    // Recibir datos de sensores
    receiveSensorData: (req, res) => {
        const { sensor, tipo, valor, ubicacion } = req.body;

        if (!sensor || !tipo || valor === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos',
                timestamp: new Date().toISOString()
            });
        }

        // Validar el tipo de datos
        if (typeof valor !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'El valor debe ser un número',
                timestamp: new Date().toISOString()
            });
        }

        db.run(
            'INSERT INTO sensor_data (sensor, tipo, valor, ubicacion) VALUES (?, ?, ?, ?)',
            [sensor, tipo, valor, ubicacion],
            function(err) {
                if (err) {
                    return handleDatabaseError(res, 'guardar datos del sensor', err);
                }

                const sensorData = {
                    id: this.lastID,
                    sensor,
                    tipo,
                    valor,
                    ubicacion,
                    timestamp: new Date().toISOString()
                };

                // Notificar a través de WebSocket
                const wsServer = req.app.get('wsServer');
                if (wsServer) {
                    const message = {
                        type: 'sensor_update',
                        data: sensorData
                    };
                    console.log('Enviando actualización de sensor:', message);
                    wsServer.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            try {
                                client.send(JSON.stringify(message));
                                console.log('Mensaje enviado al cliente');
                            } catch (error) {
                                console.error('Error al enviar mensaje al cliente:', error);
                            }
                        }
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Datos guardados correctamente',
                    data: sensorData
                });
            }
        );
    },

    // Actualizar datos de sensor
    updateSensorData: (req, res) => {
        const { sensor } = req.params;
        const { tipo, valor, ubicacion } = req.body;

        if (!tipo || valor === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        db.run(
            'UPDATE sensor_data SET tipo = ?, valor = ?, ubicacion = ? WHERE sensor = ?',
            [tipo, valor, ubicacion, sensor],
            function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error al actualizar datos del sensor',
                        error: err.message
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Sensor no encontrado'
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Datos actualizados correctamente'
                });
            }
        );
    },

    // Eliminar datos de sensor
    deleteSensorData: (req, res) => {
        const { sensor } = req.params;

        db.run('DELETE FROM sensor_data WHERE sensor = ?', [sensor], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al eliminar datos del sensor',
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Sensor no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Datos eliminados correctamente'
            });
        });
    }
};

module.exports = sensorController;
