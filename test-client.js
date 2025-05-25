const WebSocket = require('ws');

class TestClient {
    constructor(url = 'ws://localhost:3001') {
        this.url = url;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.ws.on('open', () => {
            console.log('Conectado al servidor');
            
            // Enviar algunos comandos de prueba
            this.sendTestCommands();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error al procesar mensaje:', error);
            }
        });

        this.ws.on('close', () => {
            console.log('Conexión cerrada');
        });

        this.ws.on('error', (error) => {
            console.error('Error en WebSocket:', error);
        });
    }

    handleMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        
        switch (message.type) {
            case 'initial_data':
                console.log(`[${timestamp}] Datos iniciales recibidos`);
                break;
                
            case 'status_update':
                console.log(`[${timestamp}] Actualización de estado:`);
                this.printStatusUpdate(message.data);
                break;
                
            case 'security_event':
                console.log(`[${timestamp}] Evento de seguridad:`, message.event);
                console.log('Datos:', message.data);
                break;
                
            case 'inventory_event':
                console.log(`[${timestamp}] Evento de inventario:`, message.event);
                console.log('Datos:', message.data);
                break;
                
            case 'customer_event':
                console.log(`[${timestamp}] Evento de cliente:`, message.event);
                console.log('Datos:', message.data);
                break;
                
            case 'layout_event':
                console.log(`[${timestamp}] Evento de layout:`, message.event);
                console.log('Datos:', message.data);
                break;
                
            case 'layout_warning':
                console.log(`[${timestamp}] ⚠️ Advertencia de layout en zona ${message.zoneId}:`);
                console.log('Validación:', message.validation);
                break;
                
            default:
                console.log(`[${timestamp}] Mensaje no manejado:`, message);
        }
    }

    printStatusUpdate(data) {
        // Mostrar solo cambios significativos
        if (data.security) {
            const activeAlerts = data.security.activeAlerts;
            if (activeAlerts && activeAlerts.length > 0) {
                console.log('Alertas activas:', activeAlerts.length);
            }
        }

        if (data.customers) {
            console.log('Clientes activos:', data.customers.totalCustomers);
        }

        if (data.inventory) {
            const lowStock = Object.values(data.inventory.products)
                .filter(p => p.currentStock <= p.minStock);
            if (lowStock.length > 0) {
                console.log('Productos con stock bajo:', lowStock.length);
            }
        }
    }

    sendTestCommands() {
        // Añadir algunos productos de prueba
        this.ws.send(JSON.stringify({
            type: 'inventory_command',
            command: 'add_product',
            productId: 'prod_001',
            productData: {
                name: 'Producto Test 1',
                initialStock: 50,
                minStock: 10,
                maxStock: 100,
                reorderPoint: 20,
                zone: 'A1'
            }
        }));

        // Añadir un objeto al layout
        this.ws.send(JSON.stringify({
            type: 'layout_command',
            command: 'add_object',
            zoneId: 'A1',
            object: {
                width: 2,
                length: 2,
                height: 1,
                position: { x: 1, y: 1 }
            }
        }));

        // Crear algunos clientes virtuales
        for (let i = 0; i < 3; i++) {
            this.ws.send(JSON.stringify({
                type: 'customer_command',
                command: 'create_customer'
            }));
        }
    }

    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('Intento de envío con conexión cerrada');
        }
    }
}

// Crear instancia del cliente
const client = new TestClient();

// Manejo de cierre limpio
process.on('SIGINT', () => {
    console.log('Cerrando cliente...');
    if (client.ws) {
        client.ws.close();
    }
    process.exit(0);
}); 