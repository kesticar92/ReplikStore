const request = require('supertest');
const app = require('../backend/app');
const jwt = require('jsonwebtoken');

describe('Sensor Endpoints', () => {
    let token;

    beforeAll(() => {
        token = jwt.sign(
            { userId: 'test', role: 'admin' },
            process.env.JWT_SECRET || 'test-secret-key'
        );
    });

    describe('POST /api/sensors/data', () => {
        it('should create new sensor data', async () => {
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

        it('should validate required fields', async () => {
            const invalidData = {
                sensor: 'test_sensor'
            };

            const res = await request(app)
                .post('/api/sensors/data')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/sensors/:sensor', () => {
        it('should get last sensor value', async () => {
            const res = await request(app)
                .get('/api/sensors/test_sensor')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        it('should handle non-existent sensor', async () => {
            const res = await request(app)
                .get('/api/sensors/non_existent')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/sensors', () => {
        it('should get sensor history', async () => {
            const res = await request(app)
                .get('/api/sensors')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
}); 