const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuración de base de datos de prueba
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.TEST_DB_PATH = ':memory:';

// Configuración global para Jest
jest.setTimeout(10000);

// Limpiar mocks después de cada prueba
afterEach(() => {
    jest.clearAllMocks();
});

// Configurar base de datos de prueba
beforeAll(async () => {
    const db = new sqlite3.Database(':memory:');
    
    // Crear tablas necesarias
    await new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor TEXT NOT NULL,
                tipo TEXT NOT NULL,
                valor REAL NOT NULL,
                ubicacion TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    global.testDb = db;
});

// Limpiar base de datos después de las pruebas
afterAll(async () => {
    if (global.testDb) {
        await new Promise((resolve) => {
            global.testDb.close(() => {
                resolve();
            });
        });
    }
}); 