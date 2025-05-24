const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const SecuritySystem = require('./security_system');
const InventorySystem = require('./inventory_system');
const CustomerSimulation = require('./customer_simulation');
const LayoutSystem = require('./layout_system');

// Configuración
const CONFIG = {
    port: 3001,
    updateInterval: 1000, // Intervalo de actualización de sensores en ms
    sensorTypes: ['temperatura', 'humedad', 'presion', 'movimiento', 'stock'],
    customerSimulationInterval: 5000, // 5 segundos para actualización de clientes
    stockPredictionInterval: 3600000, // 1 hora para predicciones de stock
    layoutValidationInterval: 300000 // 5 minutos para validación de layout
};

// Instanciar sistemas
const securitySystem = new SecuritySystem();
const inventorySystem = new InventorySystem();
const customerSimulation = new CustomerSimulation();
const layoutSystem = new LayoutSystem();

// Clase para gestionar sensores
class SensorManager {
    constructor() {
        this.sensors = {
            temperatura: new Map(),
            humedad: new Map(),
            presion: new Map(),
            movimiento: new Map(),
            stock: new Map()
        };
        this.initializeSensors();
    }

    initializeSensors() {
        // Inicializar sensores con valores base
        ['A1', 'A2', 'B1', 'B2'].forEach(zone => {
            this.sensors.temperatura.set(`temp_${zone}`, { value: 20 + Math.random() * 5, zone });
            this.sensors.humedad.set(`hum_${zone}`, { value: 50 + Math.random() * 20, zone });
            this.sensors.presion.set(`pres_${zone}`, { value: 1013 + Math.random() * 10, zone });
            this.sensors.movimiento.set(`mov_${zone}`, { value: Math.random() > 0.5 ? 1 : 0, zone });
            this.sensors.stock.set(`stock_${zone}`, { value: Math.floor(Math.random() * 100), zone });
        });
    }

    updateSensors() {
        // Actualizar valores de sensores con variaciones realistas
        this.sensors.temperatura.forEach((sensor, id) => {
            sensor.value += (Math.random() - 0.5) * 0.5;
        });
        this.sensors.humedad.forEach((sensor, id) => {
            sensor.value += (Math.random() - 0.5) * 2;
        });
        this.sensors.presion.forEach((sensor, id) => {
            sensor.value += (Math.random() - 0.5) * 1;
        });
        this.sensors.movimiento.forEach((sensor, id) => {
            sensor.value = Math.random() > 0.7 ? 1 : 0;
        });
        this.sensors.stock.forEach((sensor, id) => {
            if (Math.random() > 0.9) {
                sensor.value += Math.random() > 0.5 ? 1 : -1;
            }
        });

        // Integrar con sistema de seguridad
        this.sensors.movimiento.forEach((sensor, id) => {
            const zone = sensor.zone;
            securitySystem.handleMotionDetection(zone, sensor.value);
        });
    }

    getAllSensorData() {
        const data = {};
        CONFIG.sensorTypes.forEach(type => {
            data[type] = Object.fromEntries(this.sensors[type]);
        });
        // Añadir datos de seguridad
        data.security = securitySystem.getSecurityStatus();
        return data;
    }
}

// Crear servidor WebSocket
const wss = new WebSocket.Server({ port: CONFIG.port });
const sensorManager = new SensorManager();

// Manejar conexiones
wss.on('connection', (ws) => {
    console.log('Nueva conexión establecida');
    
    // Enviar datos iniciales
    ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
            ...sensorManager.getAllSensorData(),
            inventory: inventorySystem.getInventoryStatus(),
            customers: customerSimulation.getCustomerAnalytics()
        }
    }));

    // Escuchar eventos de seguridad
    securitySystem.on('motion_detected', (data) => {
        ws.send(JSON.stringify({
            type: 'security_event',
            event: 'motion_detected',
            data: data
        }));
    });

    securitySystem.on('new_alert', (alert) => {
        ws.send(JSON.stringify({
            type: 'security_event',
            event: 'new_alert',
            data: alert
        }));
    });

    // Escuchar eventos de inventario
    inventorySystem.on('stock_updated', (data) => {
        ws.send(JSON.stringify({
            type: 'inventory_event',
            event: 'stock_updated',
            data: data
        }));
    });

    inventorySystem.on('reorder_needed', (data) => {
        ws.send(JSON.stringify({
            type: 'inventory_event',
            event: 'reorder_needed',
            data: data
        }));
    });

    inventorySystem.on('stock_prediction', (data) => {
        ws.send(JSON.stringify({
            type: 'inventory_event',
            event: 'stock_prediction',
            data: data
        }));
    });

    // Escuchar eventos de clientes
    customerSimulation.on('customer_entered', (data) => {
        ws.send(JSON.stringify({
            type: 'customer_event',
            event: 'customer_entered',
            data: data
        }));
    });

    customerSimulation.on('customer_moved', (data) => {
        ws.send(JSON.stringify({
            type: 'customer_event',
            event: 'customer_moved',
            data: data
        }));
    });

    customerSimulation.on('customer_interaction', (data) => {
        ws.send(JSON.stringify({
            type: 'customer_event',
            event: 'customer_interaction',
            data: data
        }));
    });

    customerSimulation.on('customer_purchase', (data) => {
        ws.send(JSON.stringify({
            type: 'customer_event',
            event: 'customer_purchase',
            data: data
        }));
    });

    customerSimulation.on('customer_left', (data) => {
        ws.send(JSON.stringify({
            type: 'customer_event',
            event: 'customer_left',
            data: data
        }));
    });

    // Escuchar eventos de layout
    layoutSystem.on('object_added', (data) => {
        ws.send(JSON.stringify({
            type: 'layout_event',
            event: 'object_added',
            data: data
        }));
    });

    // Manejar mensajes del cliente
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Mensaje recibido:', data);
            
            switch (data.type) {
                case 'inventory_command':
                    handleInventoryCommand(data);
                    break;
                case 'customer_command':
                    handleCustomerCommand(data);
                    break;
                case 'layout_command':
                    handleLayoutCommand(data);
                    break;
                default:
                    ws.send(JSON.stringify({
                        type: 'response',
                        status: 'ok',
                        message: 'Mensaje recibido correctamente'
                    }));
            }
        } catch (error) {
            console.error('Error al procesar mensaje:', error);
        }
    });

    ws.on('close', () => {
        console.log('Conexión cerrada');
    });

    ws.on('error', (error) => {
        console.error('Error en WebSocket:', error);
    });
});

// Manejadores de comandos
function handleInventoryCommand(data) {
    switch (data.command) {
        case 'add_product':
            inventorySystem.addProduct(data.productId, data.productData);
            break;
        case 'update_stock':
            inventorySystem.updateStock(data.productId, data.quantity, data.type);
            break;
    }
}

function handleCustomerCommand(data) {
    switch (data.command) {
        case 'create_customer':
            customerSimulation.createVirtualCustomer();
            break;
        case 'move_customer':
            customerSimulation.moveCustomer(data.customerId, data.newZone);
            break;
        case 'remove_customer':
            customerSimulation.removeCustomer(data.customerId);
            break;
    }
}

// Añadir manejador de comandos de layout
function handleLayoutCommand(data) {
    try {
        switch (data.command) {
            case 'add_object':
                const objectId = layoutSystem.addObject(data.zoneId, data.object);
                return {
                    status: 'ok',
                    objectId: objectId
                };
            case 'validate_zone':
                const validation = layoutSystem.validateEvacuationRoutes(data.zoneId);
                return {
                    status: 'ok',
                    validation: validation
                };
            case 'optimize_zone':
                const optimization = layoutSystem.optimizeLayout(data.zoneId);
                return {
                    status: 'ok',
                    optimization: optimization
                };
            default:
                throw new Error(`Comando de layout desconocido: ${data.command}`);
        }
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

// Actualizar y enviar datos periódicamente
setInterval(() => {
    sensorManager.updateSensors();
    const data = {
        ...sensorManager.getAllSensorData(),
        inventory: inventorySystem.getInventoryStatus(),
        customers: customerSimulation.getCustomerAnalytics(),
        layout: layoutSystem.getLayoutStatus()
    };
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'status_update',
                timestamp: Date.now(),
                data: data
            }));
        }
    });
}, CONFIG.updateInterval);

// Simulación de clientes
setInterval(() => {
    // Crear nuevos clientes aleatoriamente
    if (Math.random() < 0.3) { // 30% de probabilidad
        const customer = customerSimulation.createVirtualCustomer();
        // Mover al cliente a una zona aleatoria
        const zones = ['A1', 'A2', 'B1', 'B2'];
        customerSimulation.moveCustomer(customer.id, zones[Math.floor(Math.random() * zones.length)]);
    }

    // Simular interacciones para clientes existentes
    customerSimulation.getActiveCustomers().forEach(customer => {
        customerSimulation.simulateInteraction(customer.id);
        customerSimulation.simulatePurchase(customer.id);
        
        // Posibilidad de que el cliente se mueva a otra zona
        if (Math.random() < 0.2) { // 20% de probabilidad
            const zones = ['A1', 'A2', 'B1', 'B2'];
            const newZone = zones[Math.floor(Math.random() * zones.length)];
            if (newZone !== customer.currentZone) {
                customerSimulation.moveCustomer(customer.id, newZone);
            }
        }

        // Posibilidad de que el cliente se vaya
        if (Math.random() < 0.1) { // 10% de probabilidad
            customerSimulation.removeCustomer(customer.id);
        }
    });
}, CONFIG.customerSimulationInterval);

// Predicción de stock periódica
setInterval(() => {
    inventorySystem.predictStockNeeds();
}, CONFIG.stockPredictionInterval);

// Añadir validación periódica de layout
setInterval(() => {
    ['A1', 'A2', 'B1', 'B2'].forEach(zoneId => {
        const validation = layoutSystem.validateEvacuationRoutes(zoneId);
        if (!validation.hasValidRoutes) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'layout_warning',
                        zoneId: zoneId,
                        validation: validation
                    }));
                }
            });
        }
    });
}, CONFIG.layoutValidationInterval);

console.log(`Servidor WebSocket iniciado en puerto ${CONFIG.port}`);

// Manejo de errores del proceso
process.on('SIGINT', () => {
    console.log('Cerrando servidor WebSocket...');
    wss.close(() => {
        console.log('Servidor WebSocket cerrado');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Error no manejado:', error);
    // Aquí podrías implementar notificaciones o logging adicional
}); 