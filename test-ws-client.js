const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class DigitalTwinClient {
    constructor(url = 'ws://localhost:3000') {
        this.url = url;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // 2 segundos
        this.sensorData = new Map();
        this.connect();
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventHandlers();
        } catch (error) {
            console.error('Error al crear conexión WebSocket:', error);
            this.handleReconnect();
        }
    }

    setupEventHandlers() {
        this.ws.on('open', () => {
            console.log('Conexión establecida con el servidor');
            this.reconnectAttempts = 0; // Resetear intentos al conectar exitosamente
            
            // Enviar mensaje de inicio
            this.send({
                type: 'client_ready',
                timestamp: Date.now()
            });
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
            this.handleReconnect();
        });

        this.ws.on('error', (error) => {
            console.error('Error en WebSocket:', error);
            // No llamamos a handleReconnect aquí porque 'close' se disparará después
        });
    }

    handleMessage(message) {
        switch (message.type) {
            case 'initial_data':
                console.log('Datos iniciales recibidos');
                this.updateSensorData(message.data);
                break;

            case 'sensor_update':
                this.updateSensorData(message.data);
                this.processSensorData();
                break;

            case 'response':
                console.log('Respuesta del servidor:', message);
                break;

            default:
                console.log('Mensaje no manejado:', message);
        }
    }

    updateSensorData(data) {
        Object.entries(data).forEach(([type, sensors]) => {
            Object.entries(sensors).forEach(([id, sensorData]) => {
                this.sensorData.set(`${type}_${id}`, {
                    ...sensorData,
                    lastUpdate: Date.now()
                });
            });
        });
    }

    processSensorData() {
        // Aquí procesarías los datos para enviar a Unreal Engine
        // Por ahora solo mostramos algunos datos de ejemplo
        const temp = Array.from(this.sensorData.entries())
            .filter(([id]) => id.startsWith('temperatura'))
            .map(([id, data]) => `${id}: ${data.value.toFixed(1)}°C`);
        
        console.log('Temperaturas actuales:', temp.join(', '));
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.log('Máximo número de intentos de reconexión alcanzado');
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
const client = new DigitalTwinClient();

// Manejo de cierre limpio
process.on('SIGINT', () => {
    console.log('Cerrando cliente...');
    if (client.ws) {
        client.ws.close();
    }
    process.exit(0);
}); 