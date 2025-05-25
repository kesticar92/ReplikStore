const Redis = require('ioredis');
const { logger } = require('./logger');

class Cache {
    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('error', (err) => {
            logger.error('Error en la conexión de Redis:', err);
        });

        this.client.on('connect', () => {
            logger.info('Conectado a Redis');
        });
    }

    async get(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Error al obtener datos del caché:', error);
            return null;
        }
    }

    async set(key, value, expireTime = 3600) {
        try {
            const stringValue = JSON.stringify(value);
            await this.client.set(key, stringValue, 'EX', expireTime);
            return true;
        } catch (error) {
            logger.error('Error al guardar datos en el caché:', error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Error al eliminar datos del caché:', error);
            return false;
        }
    }

    async flush() {
        try {
            await this.client.flushall();
            return true;
        } catch (error) {
            logger.error('Error al limpiar el caché:', error);
            return false;
        }
    }
}

// Middleware para caché de rutas
const cacheMiddleware = (duration) => {
    const cache = new Cache();
    
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;
        const cachedResponse = await cache.get(key);

        if (cachedResponse) {
            logger.debug(`Cache hit: ${key}`);
            return res.json(cachedResponse);
        }

        logger.debug(`Cache miss: ${key}`);
        
        // Guardar la función original de res.json
        const originalJson = res.json;
        
        // Sobrescribir res.json para interceptar la respuesta
        res.json = function(body) {
            cache.set(key, body, duration);
            return originalJson.call(this, body);
        };

        next();
    };
};

// Función para invalidar caché
const invalidateCache = async (pattern) => {
    const cache = new Cache();
    const keys = await cache.client.keys(`cache:${pattern}`);
    
    if (keys.length > 0) {
        await Promise.all(keys.map(key => cache.del(key)));
        logger.info(`Caché invalidado para el patrón: ${pattern}`);
    }
};

module.exports = {
    Cache,
    cacheMiddleware,
    invalidateCache
}; 