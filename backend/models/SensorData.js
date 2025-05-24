const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbConfig = require('../config/database');

let db;

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        db = new sqlite3.Database(dbConfig.path, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error al conectar con la base de datos:', err);
                reject(err);
                return;
            }
            console.log('Conexión exitosa con la base de datos SQLite');
            
            // Crear tabla si no existe
            db.run(`
                CREATE TABLE IF NOT EXISTS sensor_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sensor TEXT NOT NULL,
                    tipo TEXT NOT NULL,
                    valor REAL NOT NULL,
                    ubicacion TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error al crear la tabla:', err);
                    reject(err);
                    return;
                }
                resolve(db);
            });
        });
    });
};

class SensorData {
    static async create(data) {
        await initializeDatabase();
        return new Promise((resolve, reject) => {
            const { sensor, tipo, valor, ubicacion } = data;
            const sql = 'INSERT INTO sensor_data (sensor, tipo, valor, ubicacion) VALUES (?, ?, ?, ?)';
            
            db.run(sql, [sensor, tipo, valor, ubicacion], function(err) {
                if (err) {
                    console.error('Error al insertar datos:', err);
                    reject(err);
                    return;
                }
                resolve({ 
                    id: this.lastID, 
                    ...data,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }

    static async findBySensor(sensorId) {
        await initializeDatabase();
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM sensor_data WHERE sensor = ? ORDER BY timestamp DESC LIMIT 1';
            
            db.get(sql, [sensorId], (err, row) => {
                if (err) {
                    console.error('Error al buscar sensor:', err);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    static async getHistory(sensorId) {
        await initializeDatabase();
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM sensor_data';
            const params = [];

            if (sensorId) {
                sql += ' WHERE sensor = ?';
                params.push(sensorId);
            }

            sql += ' ORDER BY timestamp DESC';
            
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error al obtener historial:', err);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }
}

// Inicializar la base de datos al cargar el módulo
initializeDatabase().catch(console.error);

module.exports = SensorData;
