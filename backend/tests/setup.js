require('../config/test');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('../utils/logger');
const sinon = require('sinon');

let mongoServer;
let sandbox;

// Configuración global antes de todos los tests
before(async () => {
    try {
        sandbox = sinon.createSandbox();
        
        // Crear instancia de MongoDB en memoria
        mongoServer = await MongoMemoryServer.create({
            instance: {
                dbName: 'testdb',
                storageEngine: 'wiredTiger'
            }
        });
        const mongoUri = mongoServer.getUri();

        // Configurar Mongoose
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 500,
            socketTimeoutMS: 500,
            connectTimeoutMS: 500
        });

        // Mockear servicios externos con Sinon
        sandbox.stub(require('../services/cacheService'), 'get').resolves(null);
        sandbox.stub(require('../services/cacheService'), 'set').resolves();
        sandbox.stub(require('../services/cacheService'), 'delete').resolves();
        sandbox.stub(require('../services/cacheService'), 'deletePattern').resolves();

        // Configurar logger para tests
        const testLogger = {
            info: sandbox.stub(),
            error: sandbox.stub(),
            warn: sandbox.stub(),
            debug: sandbox.stub()
        };
        sandbox.stub(logger, 'info').callsFake(testLogger.info);
        sandbox.stub(logger, 'error').callsFake(testLogger.error);
        sandbox.stub(logger, 'warn').callsFake(testLogger.warn);
        sandbox.stub(logger, 'debug').callsFake(testLogger.debug);

        logger.info('Base de datos de prueba iniciada');
    } catch (error) {
        logger.error('Error al iniciar base de datos de prueba:', error);
        throw error;
    }
});

// Limpieza después de cada test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
    sandbox.restore();
});

// Limpieza después de todos los tests
after(async () => {
    try {
        await mongoose.disconnect();
        await mongoServer.stop();
        logger.info('Base de datos de prueba detenida');
    } catch (error) {
        logger.error('Error al detener base de datos de prueba:', error);
        throw error;
    }
}); 