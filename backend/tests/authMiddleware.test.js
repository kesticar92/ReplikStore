require('../config/test');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

describe('Auth Middleware', () => {
    let sandbox;
    let req;
    let res;
    let next;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        req = {
            headers: {},
            user: null,
            path: '/test',
            method: 'GET'
        };
        res = {
            status: sandbox.stub().returnsThis(),
            json: sandbox.stub()
        };
        next = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('verifyToken', () => {
        it('debería verificar un token válido', () => {
            const token = 'valid.token.here';
            const decodedToken = {
                id: '123',
                email: 'test@example.com',
                role: 'user'
            };

            req.headers.authorization = `Bearer ${token}`;
            sandbox.stub(jwt, 'verify').returns(decodedToken);

            authMiddleware.verifyToken(req, res, next);

            expect(req.user).to.deep.equal(decodedToken);
            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.undefined;
        });

        it('debería fallar sin token', () => {
            authMiddleware.verifyToken(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'Token no proporcionado'
            })).to.be.true;
            expect(next.called).to.be.false;
        });

        it('debería fallar con token inválido', () => {
            req.headers.authorization = 'Bearer invalid.token';
            const error = new Error('Token inválido');
            error.name = 'JsonWebTokenError';
            sandbox.stub(jwt, 'verify').throws(error);

            authMiddleware.verifyToken(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'Token inválido'
            })).to.be.true;
            expect(next.called).to.be.false;
        });

        it('debería fallar con formato de token incorrecto', () => {
            req.headers.authorization = 'InvalidFormat token';

            authMiddleware.verifyToken(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'Formato de token inválido'
            })).to.be.true;
            expect(next.called).to.be.false;
        });
    });

    describe('requireRole', () => {
        beforeEach(() => {
            req.user = {
                id: '123',
                email: 'test@example.com',
                role: 'user'
            };
        });

        it('debería permitir acceso con rol correcto', () => {
            const middleware = authMiddleware.requireRole('user');
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.undefined;
        });

        it('debería permitir acceso con rol de administrador', () => {
            req.user.role = 'admin';
            const middleware = authMiddleware.requireRole('user');
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.undefined;
        });

        it('debería denegar acceso con rol incorrecto', () => {
            const middleware = authMiddleware.requireRole('admin');
            middleware(req, res, next);

            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'Acceso denegado'
            })).to.be.true;
            expect(next.called).to.be.false;
        });

        it('debería fallar sin usuario autenticado', () => {
            req.user = null;
            const middleware = authMiddleware.requireRole('user');
            middleware(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'No autenticado'
            })).to.be.true;
            expect(next.called).to.be.false;
        });
    });

    describe('requireRoles', () => {
        beforeEach(() => {
            req.user = {
                id: '123',
                email: 'test@example.com',
                role: 'manager'
            };
        });

        it('debería permitir acceso con uno de los roles permitidos', () => {
            const middleware = authMiddleware.requireRoles(['admin', 'manager']);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.undefined;
        });

        it('debería denegar acceso sin roles permitidos', () => {
            const middleware = authMiddleware.requireRoles(['admin']);
            middleware(req, res, next);

            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'Acceso denegado'
            })).to.be.true;
            expect(next.called).to.be.false;
        });

        it('debería fallar sin usuario autenticado', () => {
            req.user = null;
            const middleware = authMiddleware.requireRoles(['admin', 'manager']);
            middleware(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'No autenticado'
            })).to.be.true;
            expect(next.called).to.be.false;
        });
    });
}); 