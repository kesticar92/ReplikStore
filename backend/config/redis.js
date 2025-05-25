const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisClient = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redisClient.on('connect', () => {
    logger.info('Redis conectado');
});

redisClient.on('error', (err) => {
    logger.error(`Error en Redis: ${err.message}`);
});

const DEFAULT_EXPIRATION = 3600; // 1 hora

const cacheService = {
    async get(key) {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error al obtener caché:', error);
            return null;
        }
    },

    async set(key, data, expiration = DEFAULT_EXPIRATION) {
        try {
            await redisClient.setex(key, expiration, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error al establecer caché:', error);
            return false;
        }
    },

    async del(key) {
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error('Error al eliminar caché:', error);
            return false;
        }
    },

    async invalidatePattern(pattern) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
            return true;
        } catch (error) {
            console.error('Error al invalidar caché por patrón:', error);
            return false;
        }
    }
};

const cacheMiddleware = (duration = DEFAULT_EXPIRATION) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cachedData = await cacheService.get(key);
            if (cachedData) {
                return res.json(cachedData);
            }

            const originalJson = res.json;
            res.json = function(data) {
                cacheService.set(key, data, duration);
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en middleware de caché:', error);
            next();
        }
    };
};

module.exports = {
    redisClient,
    cacheMiddleware,
    cacheService
}; 