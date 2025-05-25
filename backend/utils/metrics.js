const prometheus = require('prom-client');
const { logger } = require('./logger');

// Crear un registro de métricas
const register = new prometheus.Registry();

// Métricas de contador
const httpRequestCounter = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total de peticiones HTTP',
    labelNames: ['method', 'route', 'status']
});

const inventoryOperationCounter = new prometheus.Counter({
    name: 'inventory_operations_total',
    help: 'Total de operaciones de inventario',
    labelNames: ['operation', 'status']
});

// Métricas de histograma
const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de las peticiones HTTP',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const inventoryOperationDuration = new prometheus.Histogram({
    name: 'inventory_operation_duration_seconds',
    help: 'Duración de las operaciones de inventario',
    labelNames: ['operation'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

// Métricas de gauge
const activeConnections = new prometheus.Gauge({
    name: 'active_connections',
    help: 'Número de conexiones activas'
});

const cacheHitRatio = new prometheus.Gauge({
    name: 'cache_hit_ratio',
    help: 'Ratio de aciertos en caché'
});

// Registrar métricas
register.registerMetric(httpRequestCounter);
register.registerMetric(inventoryOperationCounter);
register.registerMetric(httpRequestDuration);
register.registerMetric(inventoryOperationDuration);
register.registerMetric(activeConnections);
register.registerMetric(cacheHitRatio);

// Middleware para métricas HTTP
const httpMetricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        
        httpRequestCounter.inc({
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode
        });
        
        httpRequestDuration.observe({
            method: req.method,
            route: req.route?.path || req.path
        }, duration);
    });
    
    next();
};

// Función para registrar operaciones de inventario
const recordInventoryOperation = (operation, status, duration) => {
    inventoryOperationCounter.inc({
        operation,
        status
    });
    
    inventoryOperationDuration.observe({
        operation
    }, duration);
};

// Función para actualizar métricas de caché
const updateCacheMetrics = (hits, misses) => {
    const total = hits + misses;
    const ratio = total > 0 ? hits / total : 0;
    cacheHitRatio.set(ratio);
};

// Función para obtener métricas
const getMetrics = async () => {
    try {
        return await register.metrics();
    } catch (error) {
        logger.error('Error al obtener métricas:', error);
        throw error;
    }
};

module.exports = {
    httpMetricsMiddleware,
    recordInventoryOperation,
    updateCacheMetrics,
    getMetrics,
    register
}; 