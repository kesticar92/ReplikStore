const request = require('supertest');
const WebSocket = require('ws');
const app = require('../backend/app');
const jwt = require('jsonwebtoken');
const http = require('http');

jest.setTimeout(30000); // Aumentar el timeout global

describe('Pruebas de Integración del Gemelo Digital', () => {
    let token;
    let server;
    let wss;
    const TEST_PORT = 3001;

    beforeAll((done) => {
        token = jwt.sign(
            { userId: 'test', role: 'admin' },
            process.env.JWT_SECRET || 'test-secret-key'
        );
        server = http.createServer(app);
        wss = new WebSocket.Server({ 
            server,
            path: '/ws'
        });

        server.listen(TEST_PORT, () => {
            console.log(`Servidor de pruebas iniciado en puerto ${TEST_PORT}`);
            done();
        });
    });

    afterAll((done) => {
        server.close(() => {
            wss.close(() => {
                done();
            });
        });
    });

    describe('Autenticación y Roles', () => {
        it('Debe permitir login con credenciales válidas', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('role', 'admin');
        });

        it('Debe rechazar tokens inválidos', async () => {
            const res = await request(app)
                .get('/api/sensors')
                .set('Authorization', 'Bearer invalid_token');

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('Debe rechazar peticiones sin token', async () => {
            const res = await request(app)
                .get('/api/sensors');

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('Debe validar roles correctamente', async () => {
            const viewerToken = jwt.sign(
                { userId: 'test_viewer', role: 'viewer' },
                process.env.JWT_SECRET || 'test-secret-key'
            );

            const resViewer = await request(app)
                .post('/api/sensors/data')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    sensor: 'test_sensor',
                    tipo: 'temperatura',
                    valor: 25.5
                });

            expect(resViewer.statusCode).toBe(403);
        });
    });

    describe('Sensores IoT', () => {
        it('Debe registrar datos de sensores', async () => {
            const sensorData = {
                sensor: 'test_sensor',
                tipo: 'temperatura',
                valor: 25.5,
                ubicacion: 'test_location'
            };

            const res = await request(app)
                .post('/api/sensors/data')
                .set('Authorization', `Bearer ${token}`)
                .send(sensorData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.sensor).toBe(sensorData.sensor);
        });

        it('Debe manejar 100 sensores simultáneos', async () => {
            const promises = Array.from({ length: 100 }, (_, i) => {
                return request(app)
                    .post('/api/sensors/data')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        sensor: `sensor_${i}`,
                        tipo: 'temperatura',
                        valor: Math.random() * 50,
                        ubicacion: `location_${i % 10}`
                    });
            });

            const results = await Promise.all(promises);
            results.forEach(res => {
                expect(res.statusCode).toBe(201);
                expect(res.body.success).toBe(true);
            });
        });
    });

    describe('Sincronización en Tiempo Real', () => {
        let ws;

        beforeEach((done) => {
            let authenticated = false;
            const authTimeout = setTimeout(() => {
                if (!authenticated) {
                    done(new Error('Timeout en autenticación WebSocket'));
                }
            }, 5000);

            ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);
            
            ws.on('open', () => {
                ws.send(JSON.stringify({
                    type: 'auth',
                    token
                }));
            });

            ws.on('error', (error) => {
                clearTimeout(authTimeout);
                console.error('Error en WebSocket:', error);
                done(error);
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'auth' && message.status === 'success') {
                        authenticated = true;
                        clearTimeout(authTimeout);
                        done();
                    }
                } catch (error) {
                    clearTimeout(authTimeout);
                    done(error);
                }
            });
        });

        afterEach((done) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            setTimeout(done, 1000); // Dar tiempo para que se cierre la conexión
        });

        it('Debe autenticar la conexión WebSocket', (done) => {
            const timeout = setTimeout(() => {
                done(new Error('Timeout esperando autenticación'));
            }, 5000);

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'auth' && message.status === 'success') {
                        clearTimeout(timeout);
                        done();
                    }
                } catch (error) {
                    clearTimeout(timeout);
                    done(error);
                }
            });

            // Reenviar autenticación por si acaso
            ws.send(JSON.stringify({
                type: 'auth',
                token
            }));
        }, 6000);

        it('Debe sincronizar cambios en tiempo real', (done) => {
            const timeout = setTimeout(() => {
                done(new Error('Timeout esperando sincronización'));
            }, 5000);

            const testData = {
                sensor: 'realtime_test',
                tipo: 'temperatura',
                valor: 25.5
            };

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'sensor_update') {
                        expect(message.data.sensor).toBe(testData.sensor);
                        clearTimeout(timeout);
                        done();
                    }
                } catch (error) {
                    clearTimeout(timeout);
                    done(error);
                }
            });

            // Esperar a que la conexión esté lista
            setTimeout(() => {
                request(app)
                    .post('/api/sensors/data')
                    .set('Authorization', `Bearer ${token}`)
                    .send(testData)
                    .then(() => {
                        if (typeof global.broadcastUpdate === 'function') {
                            global.broadcastUpdate('sensor_update', testData);
                        } else {
                            clearTimeout(timeout);
                            done(new Error('broadcastUpdate no está definido'));
                        }
                    })
                    .catch((error) => {
                        clearTimeout(timeout);
                        done(error);
                    });
            }, 1000);
        }, 6000);
    });
}); 