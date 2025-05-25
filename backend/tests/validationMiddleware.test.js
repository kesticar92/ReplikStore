const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const validationMiddleware = require('../middleware/validation');

describe('Validation Middleware', () => {
    let sandbox;
    let req;
    let res;
    let next;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        req = {
            body: {},
            query: {},
            params: {}
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

    describe('validateRequest', () => {
        it('debería validar correctamente los campos requeridos', () => {
            const schema = {
                body: {
                    email: { type: 'string', required: true, format: 'email' },
                    password: { type: 'string', required: true, minLength: 8 }
                }
            };

            req.body = {
                email: 'test@example.com',
                password: 'Password123!'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.undefined;
        });

        it('debería fallar con campos requeridos faltantes', () => {
            const schema = {
                body: {
                    email: { type: 'string', required: true, format: 'email' },
                    password: { type: 'string', required: true, minLength: 8 }
                }
            };

            req.body = {
                email: 'test@example.com'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo password es requerido en body');
        });

        it('debería validar el formato de email', () => {
            const schema = {
                body: {
                    email: { type: 'string', required: true, format: 'email' }
                }
            };

            req.body = {
                email: 'invalid-email'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo email debe ser un email válido en body');
        });

        it('debería validar la longitud mínima', () => {
            const schema = {
                body: {
                    password: { type: 'string', required: true, minLength: 8 }
                }
            };

            req.body = {
                password: 'short'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo password debe tener al menos 8 caracteres en body');
        });

        it('debería validar la longitud máxima', () => {
            const schema = {
                body: {
                    name: { type: 'string', required: true, maxLength: 5 }
                }
            };

            req.body = {
                name: 'toolongname'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo name no debe exceder 5 caracteres en body');
        });

        it('debería validar valores numéricos', () => {
            const schema = {
                body: {
                    age: { type: 'number', required: true, min: 18, max: 100 }
                }
            };

            req.body = {
                age: 15
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo age debe ser mayor o igual a 18 en body');
        });

        it('debería validar arrays', () => {
            const schema = {
                body: {
                    tags: { type: 'array', required: true }
                }
            };

            req.body = {
                tags: 'not-an-array'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo tags debe ser un array en body');
        });

        it('debería validar objetos', () => {
            const schema = {
                body: {
                    address: { type: 'object', required: true }
                }
            };

            req.body = {
                address: 'not-an-object'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo address debe ser un objeto en body');
        });

        it('debería validar enums', () => {
            const schema = {
                body: {
                    status: { type: 'string', required: true, enum: ['active', 'inactive'] }
                }
            };

            req.body = {
                status: 'invalid'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo status debe ser uno de los siguientes valores: active, inactive en body');
        });

        it('debería validar patrones regex', () => {
            const schema = {
                body: {
                    code: { type: 'string', required: true, pattern: '^[A-Z]{2}\\d{3}$' }
                }
            };

            req.body = {
                code: 'invalid'
            };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0].message).to.equal('El campo code no cumple con el patrón requerido en body');
        });

        it('debería validar múltiples contextos', () => {
            const schema = {
                body: {
                    name: { type: 'string', required: true }
                },
                query: {
                    page: { type: 'number', required: true }
                },
                params: {
                    id: { type: 'string', required: true }
                }
            };

            req.body = { name: 'Test' };
            req.query = { page: 1 };
            req.params = { id: '123' };

            const middleware = validationMiddleware.validateRequest(schema);
            middleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.undefined;
        });
    });
}); 