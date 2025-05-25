const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const cacheService = require('../services/cacheService');
const { cache, invalidate } = require('../middleware/cache');

describe('Cache Service', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('get', () => {
        it('debería obtener datos de caché', async () => {
            const mockData = { test: 'data' };
            sandbox.stub(cacheService.client, 'get').resolves(JSON.stringify(mockData));

            const result = await cacheService.get('test-key');
            expect(result).to.deep.equal(mockData);
        });

        it('debería retornar null si no hay datos en caché', async () => {
            sandbox.stub(cacheService.client, 'get').resolves(null);

            const result = await cacheService.get('test-key');
            expect(result).to.be.null;
        });
    });

    describe('set', () => {
        it('debería guardar datos en caché', async () => {
            const mockData = { test: 'data' };
            sandbox.stub(cacheService.client, 'setex').resolves('OK');

            const result = await cacheService.set('test-key', mockData);
            expect(result).to.be.true;
        });

        it('debería manejar errores al guardar en caché', async () => {
            const mockData = { test: 'data' };
            sandbox.stub(cacheService.client, 'setex').rejects(new Error('Redis error'));

            const result = await cacheService.set('test-key', mockData);
            expect(result).to.be.false;
        });
    });

    describe('delete', () => {
        it('debería eliminar datos de caché', async () => {
            sandbox.stub(cacheService.client, 'del').resolves(1);

            const result = await cacheService.delete('test-key');
            expect(result).to.be.true;
        });

        it('debería manejar errores al eliminar de caché', async () => {
            sandbox.stub(cacheService.client, 'del').rejects(new Error('Redis error'));

            const result = await cacheService.delete('test-key');
            expect(result).to.be.false;
        });
    });

    describe('deletePattern', () => {
        it('debería eliminar datos por patrón', async () => {
            sandbox.stub(cacheService.client, 'keys').resolves(['key1', 'key2']);
            sandbox.stub(cacheService.client, 'del').resolves(2);

            const result = await cacheService.deletePattern('test-*');
            expect(result).to.be.true;
        });

        it('debería manejar errores al eliminar por patrón', async () => {
            sandbox.stub(cacheService.client, 'keys').rejects(new Error('Redis error'));

            const result = await cacheService.deletePattern('test-*');
            expect(result).to.be.false;
        });
    });
});

describe('Cache Middleware', () => {
    let sandbox;
    let req;
    let res;
    let next;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        req = {
            method: 'GET',
            path: '/api/test',
            query: { param: 'value' }
        };
        res = {
            json: sandbox.stub()
        };
        next = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('cache', () => {
        it('debería cachear respuesta GET', async () => {
            const mockData = { test: 'data' };

            sandbox.stub(cacheService, 'get').resolves(null);
            sandbox.stub(cacheService, 'set').resolves(true);

            await cache(req, res, next);

            // Simular respuesta
            res.json(mockData);

            expect(cacheService.set.calledOnce).to.be.true;
            expect(next.calledOnce).to.be.true;
        });

        it('debería retornar datos de caché si existen', async () => {
            const mockData = { test: 'data' };

            sandbox.stub(cacheService, 'get').resolves(mockData);

            await cache(req, res, next);

            expect(res.json.calledWith(mockData)).to.be.true;
            expect(next.called).to.be.false;
        });

        it('debería ignorar peticiones no GET', async () => {
            sandbox.stub(cacheService, 'get');
            req.method = 'POST';
            await cache(req, res, next);
            expect(next.calledOnce).to.be.true;
            expect(cacheService.get.called).to.be.false;
        });
    });

    describe('invalidate', () => {
        it('debería invalidar caché por patrón', async () => {
            sandbox.stub(cacheService, 'deletePattern').resolves(true);

            await invalidate('test-*');

            expect(cacheService.deletePattern.calledWith('test-*')).to.be.true;
        });

        it('debería manejar errores al invalidar caché', async () => {
            sandbox.stub(cacheService, 'deletePattern').rejects(new Error('Redis error'));

            await invalidate('test-*');

            expect(cacheService.deletePattern.calledWith('test-*')).to.be.true;
        });
    });
}); 