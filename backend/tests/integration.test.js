const WebSocket = require('ws');
const axios = require('axios');

const TEST_PORT = 3001;
const API_URL = `http://localhost:${TEST_PORT}/api`;
const WS_URL = `ws://localhost:${TEST_PORT}/ws`;
const TEST_TIMEOUT = 120000; // 2 minutos
const WS_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

describe('Pruebas de Integración Digital Twin', () => {
    let authToken;
    let ws;
    let server;

    const connectWebSocket = () => {
        return new Promise((resolve, reject) => {
            ws = new WebSocket(WS_URL);
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('WebSocket connection timeout'));
            }, WS_TIMEOUT);

            ws.on('open', () => {
                clearTimeout(timeout);
                
                // Esperar mensaje de bienvenida
                const welcomeTimeout = setTimeout(() => {
                    ws.close();
                    reject(new Error('Welcome message timeout'));
                }, WS_TIMEOUT);

                const messageHandler = (data) => {
                    try {
                        const message = JSON.parse(data);
                        if (message.type === 'welcome') {
                            clearTimeout(welcomeTimeout);
                            ws.removeListener('message', messageHandler);
                            resolve();
                        }
                    } catch (error) {
                        console.error('Error parsing welcome message:', error);
                    }
                };

                ws.on('message', messageHandler);
            });

            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    };

    beforeAll(async () => {
        // Configurar entorno de prueba
        process.env.NODE_ENV = 'test';
        process.env.PORT = TEST_PORT;

        // Iniciar servidor
        server = require('../server');
        await new Promise((resolve) => {
            server.listen(TEST_PORT, () => {
                console.log(`Servidor de pruebas iniciado en puerto ${TEST_PORT}`);
                resolve();
            });
        });

        // Obtener token de autenticación
        const response = await axios.post(`${API_URL}/auth/test-token`);
        authToken = response.data.token;
    }, TEST_TIMEOUT);

    afterAll(async () => {
        return new Promise((resolve) => {
            if (server) {
                server.close(() => {
                    console.log('Servidor de pruebas cerrado');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });

    beforeEach(async () => {
        // Intentar conectar con reintentos
        let lastError;
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                await connectWebSocket();
                return; // Conexión exitosa
            } catch (error) {
                console.log(`Intento ${i + 1} fallido: ${error.message}`);
                lastError = error;
                if (i < MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            }
        }
        throw lastError; // Si llegamos aquí, todos los intentos fallaron
    }, TEST_TIMEOUT);

    afterEach(async () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    });

    const waitForWebSocketMessage = async (type, timeout = WS_TIMEOUT) => {
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                return await new Promise((resolve, reject) => {
                    const timer = setTimeout(() => {
                        ws.removeListener('message', messageHandler);
                        reject(new Error(`WebSocket ${type} message timeout (intento ${i + 1})`));
                    }, timeout);

                    const messageHandler = (data) => {
                        try {
                            const message = JSON.parse(data);
                            if (message.type === type) {
                                clearTimeout(timer);
                                ws.removeListener('message', messageHandler);
                                resolve(message);
                            }
                        } catch (error) {
                            clearTimeout(timer);
                            ws.removeListener('message', messageHandler);
                            reject(new Error(`Error parsing WebSocket message: ${error.message}`));
                        }
                    };

                    ws.on('message', messageHandler);

                    // Verificar estado de la conexión
                    if (ws.readyState !== WebSocket.OPEN) {
                        clearTimeout(timer);
                        ws.removeListener('message', messageHandler);
                        reject(new Error('WebSocket connection is not open'));
                    }
                });
            } catch (error) {
                console.log(`Intento ${i + 1} de recibir mensaje ${type} fallido: ${error.message}`);
                if (i < MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                } else {
                    throw error;
                }
            }
        }
    };

    test('Flujo completo de datos de temperatura', async () => {
        const tempData = {
            sensor: 'temp_001',
            tipo: 'temperatura',
            valor: 25.5,
            ubicacion: 'sala_principal'
        };

        // Configurar listener antes de enviar datos
        const messagePromise = waitForWebSocketMessage('sensor_update');

        const response = await axios.post(
            `${API_URL}/sensors/data`,
            tempData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);

        const wsMessage = await messagePromise;
        expect(wsMessage.type).toBe('sensor_update');
        expect(wsMessage.data.sensor).toBe('temp_001');
    }, TEST_TIMEOUT);

    test('Flujo completo de datos de humedad', async () => {
        const humData = {
            sensor: 'hum_001',
            tipo: 'humedad',
            valor: 65.0,
            ubicacion: 'sala_principal'
        };

        // Configurar listener antes de enviar datos
        const messagePromise = waitForWebSocketMessage('sensor_update');

        const response = await axios.post(
            `${API_URL}/sensors/data`,
            humData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);

        const wsMessage = await messagePromise;
        expect(wsMessage.type).toBe('sensor_update');
        expect(wsMessage.data.sensor).toBe('hum_001');
    }, TEST_TIMEOUT);

    test('Flujo completo de datos de presión', async () => {
        const presData = {
            sensor: 'pres_001',
            tipo: 'presion',
            valor: 1013.25,
            ubicacion: 'sala_principal'
        };

        // Configurar listener antes de enviar datos
        const messagePromise = waitForWebSocketMessage('sensor_update');

        const response = await axios.post(
            `${API_URL}/sensors/data`,
            presData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);

        const wsMessage = await messagePromise;
        expect(wsMessage.type).toBe('sensor_update');
        expect(wsMessage.data.sensor).toBe('pres_001');
    }, TEST_TIMEOUT);

    test('Actualización múltiple de sensores', async () => {
        const sensors = [
            {
                sensor: 'temp_001',
                tipo: 'temperatura',
                valor: 26.5,
                ubicacion: 'sala_principal'
            },
            {
                sensor: 'hum_001',
                tipo: 'humedad',
                valor: 68.0,
                ubicacion: 'sala_principal'
            },
            {
                sensor: 'pres_001',
                tipo: 'presion',
                valor: 1015.0,
                ubicacion: 'sala_principal'
            }
        ];

        const receivedMessages = new Set();
        const messageHandler = (data) => {
            try {
                const message = JSON.parse(data);
                if (message.type === 'sensor_update') {
                    receivedMessages.add(message.data.sensor);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        // Agregar el listener de mensajes
        ws.on('message', messageHandler);

        // Enviar datos de sensores
        for (const sensorData of sensors) {
            await axios.post(
                `${API_URL}/sensors/data`,
                sensorData,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            // Pequeña pausa entre envíos para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Esperar a que todos los mensajes sean recibidos
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remover el listener
        ws.removeListener('message', messageHandler);

        // Verificar que todos los mensajes fueron recibidos
        const expectedSensors = new Set(sensors.map(s => s.sensor));
        expect(receivedMessages).toEqual(expectedSensors);
    }, TEST_TIMEOUT);
}); 