const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.client = new Redis(process.env.REDIS_URL);
        this.client.on('error', (error) => {
            logger.error('Error en conexión Redis:', error);
        });
        this.client.on('connect', () => {
            logger.info('Redis conectado');
        });

        // Prefijo para las claves de caché
        this.prefix = 'replkstore:';
    }

    async get(key) {
        try {
            const value = await this.client.get(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Error al obtener de caché:', {
                key,
                error: error.message
            });
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            const stringValue = JSON.stringify(value);
            await this.client.setex(this.prefix + key, ttl, stringValue);
            return true;
        } catch (error) {
            logger.error('Error al guardar en caché:', {
                key,
                error: error.message
            });
            return false;
        }
    }

    async delete(key) {
        try {
            await this.client.del(this.prefix + key);
            return true;
        } catch (error) {
            logger.error('Error al eliminar de caché:', {
                key,
                error: error.message
            });
            return false;
        }
    }

    async deletePattern(pattern) {
        try {
            const keys = await this.client.keys(this.prefix + pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            logger.error('Error al eliminar patrón de caché:', {
                pattern,
                error: error.message
            });
            return false;
        }
    }

    async exists(key) {
        try {
            return await this.client.exists(this.prefix + key);
        } catch (error) {
            logger.error('Error al verificar existencia en caché:', {
                key,
                error: error.message
            });
            return false;
        }
    }

    async increment(key) {
        try {
            return await this.client.incr(this.prefix + key);
        } catch (error) {
            logger.error('Error al incrementar en caché:', {
                key,
                error: error.message
            });
            return null;
        }
    }

    async decrement(key) {
        try {
            return await this.client.decr(this.prefix + key);
        } catch (error) {
            logger.error('Error al decrementar en caché:', {
                key,
                error: error.message
            });
            return null;
        }
    }

    async flush() {
        try {
            await this.client.flushdb();
            return true;
        } catch (error) {
            logger.error('Error al limpiar caché:', {
                error: error.message
            });
            return false;
        }
    }

    async healthCheck() {
        try {
            await this.client.ping();
            return true;
        } catch (error) {
            logger.error('Error en health check de Redis:', {
                error: error.message
            });
            return false;
        }
    }
}

module.exports = new CacheService(); 