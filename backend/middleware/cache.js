const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class CacheMiddleware {
    constructor() {
        this.defaultTTL = 3600; // 1 hora por defecto
        this.cache = this.cache.bind(this);
        this.invalidate = this.invalidate.bind(this);
    }

    async cache(req, res, next) {
        if (req.method !== 'GET') {
            return next();
        }

        try {
            const key = this._generateCacheKey(req);
            const cachedData = await cacheService.get(key);

            if (cachedData) {
                logger.info('Cache hit', { key });
                return res.json(cachedData);
            }

            logger.info('Cache miss', { key });
            res.sendResponse = res.json;
            res.json = (body) => {
                cacheService.set(key, body);
                res.sendResponse(body);
            };

            next();
        } catch (error) {
            logger.error('Error en middleware de caché', { error: error.message });
            next();
        }
    }

    async invalidate(pattern) {
        try {
            await cacheService.deletePattern(pattern);
            logger.info('Cache invalidado', { pattern });
        } catch (error) {
            logger.error('Error al invalidar caché', { error: error.message, pattern });
        }
    }

    _generateCacheKey(req) {
        return `${req.path}:${JSON.stringify(req.query)}`;
    }
}

const cacheMiddleware = new CacheMiddleware();
module.exports = {
    cache: cacheMiddleware.cache.bind(cacheMiddleware),
    invalidate: cacheMiddleware.invalidate.bind(cacheMiddleware)
}; 