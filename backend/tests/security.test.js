const axios = require('axios');
const WebSocket = require('ws');

const TEST_PORT = 3003;
const API_URL = `http://localhost:${TEST_PORT}/api`;
const WS_URL = `ws://localhost:${TEST_PORT}/ws`;
const TEST_TIMEOUT = 30000;

describe('Pruebas de Seguridad', () => {
    let server;
    let validToken;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        process.env.PORT = TEST_PORT;
        server = require('../server');
        
        // Obtener token válido para comparaciones
        const response = await axios.post(`${API_URL}/auth/test-token`);
        validToken = response.data.token;
    }, TEST_TIMEOUT);

    afterAll(async () => {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
    });

    describe('Pruebas de Autenticación', () => {
        test('Rechazar petición sin token', async () => {
            await expect(
                axios.get(`${API_URL}/sensors/all`)
            ).rejects.toThrow('Request failed with status code 401');
        });

        test('Rechazar token inválido', async () => {
            await expect(
                axios.get(`${API_URL}/sensors/all`, {
                    headers: { Authorization: 'Bearer invalid_token' }
                })
            ).rejects.toThrow('Request failed with status code 401');
        });

        test('Rechazar token expirado', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.2hDgYvYRtr7VZmHl2XGpEzBW5XTf_3YLt8EZFWL5Rics';
            
            await expect(
                axios.get(`${API_URL}/sensors/all`, {
                    headers: { Authorization: `Bearer ${expiredToken}` }
                })
            ).rejects.toThrow('Request failed with status code 401');
        });
    });

    describe('Pruebas de Autorización', () => {
        test('Rechazar acceso a rutas protegidas sin rol adecuado', async () => {
            // Crear token con rol viewer
            const viewerResponse = await axios.post(`${API_URL}/auth/test-token`, { role: 'viewer' });
            const viewerToken = viewerResponse.data.token;

            // Intentar eliminar datos (solo permitido para admin)
            await expect(
                axios.delete(`${API_URL}/sensors/test_sensor`, {
                    headers: { Authorization: `Bearer ${viewerToken}` }
                })
            ).rejects.toThrow('Request failed with status code 403');
        });
    });

    describe('Pruebas de Validación de Datos', () => {
        test('Rechazar datos malformados', async () => {
            const invalidData = {
                sensor: 'test_sensor',
                // Falta el tipo
                valor: 'no_numerico', // Valor incorrecto
                ubicacion: 123 // Tipo incorrecto
            };

            await expect(
                axios.post(`${API_URL}/sensors/data`, invalidData, {
                    headers: { 
                        Authorization: `Bearer ${validToken}`,
                        'Content-Type': 'application/json'
                    }
                })
            ).rejects.toThrow('Request failed with status code 400');
        });

        test('Rechazar inyección SQL', async () => {
            const maliciousData = {
                sensor: "test_sensor'; DROP TABLE sensor_data; --",
                tipo: 'temperatura',
                valor: 25,
                ubicacion: 'zona_test'
            };

            const response = await axios.post(
                `${API_URL}/sensors/data`,
                maliciousData,
                {
                    headers: { 
                        Authorization: `Bearer ${validToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Verificar que los datos se guardaron de forma segura
            expect(response.status).toBe(201);
            
            // Verificar que la tabla sigue existiendo
            const getAllResponse = await axios.get(
                `${API_URL}/sensors/all`,
                {
                    headers: { Authorization: `Bearer ${validToken}` }
                }
            );
            expect(getAllResponse.status).toBe(200);
        });
    });

    describe('Pruebas de Rate Limiting', () => {
        test('Limitar peticiones excesivas', async () => {
            const requests = [];
            for (let i = 0; i < 100; i++) {
                requests.push(
                    axios.get(`${API_URL}/sensors/all`, {
                        headers: { Authorization: `Bearer ${validToken}` }
                    })
                );
            }

            const results = await Promise.allSettled(requests);
            const tooManyRequests = results.filter(r => r.status === 'rejected' && r.reason.response?.status === 429);
            
            // Debería haber algunos rechazos por rate limiting
            expect(tooManyRequests.length).toBeGreaterThan(0);
        });
    });

    describe('Pruebas de WebSocket', () => {
        test('Rechazar conexiones WebSocket sin autenticación', async () => {
            const ws = new WebSocket(WS_URL);
            
            await expect(new Promise((resolve, reject) => {
                ws.on('error', reject);
                ws.on('close', () => reject(new Error('Conexión rechazada')));
                ws.on('open', resolve);
            })).rejects.toThrow();
        });

        test('Validar formato de mensajes WebSocket', async () => {
            const ws = new WebSocket(WS_URL);
            await new Promise(resolve => ws.on('open', resolve));

            // Enviar mensaje con formato inválido
            ws.send('mensaje_invalido');

            await expect(new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'error') {
                        reject(new Error(message.message));
                    }
                    resolve(message);
                });
            })).rejects.toThrow();

            ws.close();
        });
    });
}); 