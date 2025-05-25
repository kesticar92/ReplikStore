const EventEmitter = require('events');
const { logger } = require('./logger');
const { businessLogger } = require('./logger');
const notificationService = require('./notifications');

class InventoryEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Aumentar el límite de listeners
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Evento de stock bajo
        this.on('lowStock', async (product) => {
            try {
                businessLogger('lowStock', {
                    sku: product.sku,
                    currentStock: product.currentStock,
                    reorderPoint: product.reorderPoint,
                    timestamp: new Date().toISOString()
                });
                
                // Notificar stock bajo
                await notificationService.notifyLowStock(product);
                
                // Aquí se pueden agregar más acciones como:
                // - Crear órdenes de compra automáticas
                // - Actualizar dashboards
                // - Generar reportes
            } catch (error) {
                logger.error('Error en el manejo del evento lowStock:', {
                    error: error.message,
                    product: product?.sku,
                    stack: error.stack
                });
            }
        });

        // Evento de actualización de stock
        this.on('stockUpdated', async (data) => {
            try {
                businessLogger('stockUpdated', {
                    sku: data.sku,
                    oldStock: data.oldStock,
                    newStock: data.newStock,
                    type: data.type,
                    timestamp: new Date().toISOString()
                });

                // Notificar actualización de stock
                await notificationService.notifyStockUpdate(
                    data.product,
                    data.oldStock,
                    data.newStock,
                    data.type
                );
            } catch (error) {
                logger.error('Error en el manejo del evento stockUpdated:', {
                    error: error.message,
                    data: {
                        sku: data?.sku,
                        type: data?.type
                    },
                    stack: error.stack
                });
            }
        });

        // Evento de producto creado
        this.on('productCreated', async (product) => {
            try {
                businessLogger('productCreated', {
                    sku: product.sku,
                    name: product.name,
                    category: product.category,
                    timestamp: new Date().toISOString()
                });

                // Aquí se pueden agregar más acciones como:
                // - Actualizar índices de búsqueda
                // - Notificar a sistemas externos
                // - Generar códigos de barras
            } catch (error) {
                logger.error('Error en el manejo del evento productCreated:', {
                    error: error.message,
                    product: product?.sku,
                    stack: error.stack
                });
            }
        });

        // Evento de producto actualizado
        this.on('productUpdated', async (data) => {
            try {
                businessLogger('productUpdated', {
                    sku: data.sku,
                    changes: data.changes,
                    timestamp: new Date().toISOString()
                });

                // Aquí se pueden agregar más acciones como:
                // - Actualizar caché
                // - Notificar cambios a sistemas externos
                // - Actualizar índices de búsqueda
            } catch (error) {
                logger.error('Error en el manejo del evento productUpdated:', {
                    error: error.message,
                    data: {
                        sku: data?.sku,
                        changes: data?.changes
                    },
                    stack: error.stack
                });
            }
        });

        // Evento de producto eliminado
        this.on('productDeleted', async (sku) => {
            try {
                businessLogger('productDeleted', { 
                    sku,
                    timestamp: new Date().toISOString()
                });

                // Aquí se pueden agregar más acciones como:
                // - Limpiar caché
                // - Actualizar índices de búsqueda
                // - Notificar a sistemas externos
            } catch (error) {
                logger.error('Error en el manejo del evento productDeleted:', {
                    error: error.message,
                    sku,
                    stack: error.stack
                });
            }
        });

        // Evento de error general
        this.on('error', (error) => {
            logger.error('Error en el sistema de eventos:', {
                error: error.message,
                stack: error.stack
            });
        });
    }

    // Métodos para emitir eventos con validación
    emitLowStock(product) {
        if (!product || !product.sku) {
            logger.error('Intento de emitir evento lowStock con producto inválido');
            return;
        }
        this.emit('lowStock', product);
    }

    emitStockUpdated(data) {
        if (!data || !data.sku || !data.product) {
            logger.error('Intento de emitir evento stockUpdated con datos inválidos');
            return;
        }
        this.emit('stockUpdated', data);
    }

    emitProductCreated(product) {
        if (!product || !product.sku) {
            logger.error('Intento de emitir evento productCreated con producto inválido');
            return;
        }
        this.emit('productCreated', product);
    }

    emitProductUpdated(data) {
        if (!data || !data.sku || !data.changes) {
            logger.error('Intento de emitir evento productUpdated con datos inválidos');
            return;
        }
        this.emit('productUpdated', data);
    }

    emitProductDeleted(sku) {
        if (!sku) {
            logger.error('Intento de emitir evento productDeleted con SKU inválido');
            return;
        }
        this.emit('productDeleted', sku);
    }

    // Método para limpiar todos los listeners
    cleanup() {
        this.removeAllListeners();
        logger.info('Todos los listeners de eventos han sido removidos');
    }
}

module.exports = new InventoryEventEmitter(); 