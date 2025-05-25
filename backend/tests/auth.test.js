require('../config/test');
const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
const mongoose = require('mongoose');
const authService = require('../services/authService');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

describe('Auth Service', () => {
    let sandbox;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        // Limpiar la colección de usuarios antes de cada test
        await User.deleteMany({});
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('login', () => {
        it('debería autenticar usuario correctamente', async () => {
            // Crear usuario de prueba
            const user = new User({
                email: 'test@example.com',
                password: await User.hashPassword('password123'),
                name: 'Test User',
                role: 'user'
            });
            await user.save();

            // Stub de jwt.sign
            const token = 'test-token';
            const refreshToken = 'test-refresh-token';
            sinon.stub(jwt, 'sign')
                .onFirstCall().returns(token)
                .onSecondCall().returns(refreshToken);

            const result = await authService.login('test@example.com', 'password123');

            expect(result).to.have.property('token', token);
            expect(result).to.have.property('refreshToken', refreshToken);
            expect(result.user).to.have.property('email', 'test@example.com');
            expect(result.user).to.not.have.property('password');
        });

        it('debería manejar credenciales inválidas', async () => {
            try {
                await authService.login('invalid@example.com', 'wrongpassword');
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.equal('Credenciales inválidas');
            }
        });

        it('debería fallar con usuario inactivo', async () => {
            const mockUser = {
                email: 'test@example.com',
                password: 'hashedPassword',
                status: 'inactive'
            };

            sandbox.stub(User, 'findOne').resolves(mockUser);
            sandbox.stub(bcrypt, 'compare').resolves(true);

            try {
                await authService.login('test@example.com', 'password123');
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.equal('Usuario inactivo');
            }
        });
    });

    describe('register', () => {
        it('debería registrar un nuevo usuario exitosamente', async () => {
            const userData = {
                email: 'new@example.com',
                password: 'Password123!',
                name: 'New User'
            };

            sandbox.stub(User, 'findOne').resolves(null);
            sandbox.stub(bcrypt, 'genSalt').resolves('salt');
            sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');

            const mockUser = {
                _id: '123',
                ...userData,
                password: 'hashedPassword',
                role: 'user',
                status: 'active',
                save: sandbox.stub().resolves()
            };

            sandbox.stub(User.prototype, 'save').resolves(mockUser);

            const result = await authService.register(userData);

            expect(result).to.have.property('id', '123');
            expect(result).to.have.property('email', userData.email);
            expect(result).to.have.property('name', userData.name);
            expect(result).to.have.property('role', 'user');
        });

        it('debería fallar si el email ya está registrado', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'Password123!',
                name: 'Existing User'
            };

            sandbox.stub(User, 'findOne').resolves({ email: userData.email });

            try {
                await authService.register(userData);
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.equal('El email ya está registrado');
            }
        });
    });

    describe('refreshToken', () => {
        it('debería refrescar el token exitosamente', async () => {
            const mockUser = {
                _id: '123',
                email: 'test@example.com',
                role: 'user',
                status: 'active',
                save: sandbox.stub().resolves()
            };

            sandbox.stub(jwt, 'verify').returns({ id: '123' });
            sandbox.stub(User, 'findOne').resolves(mockUser);
            sandbox.stub(jwt, 'sign').returns('newToken');

            const result = await authService.refreshToken('validRefreshToken');

            expect(result).to.have.property('token');
            expect(result).to.have.property('refreshToken');
        });

        it('debería fallar con token de actualización inválido', async () => {
            sandbox.stub(jwt, 'verify').throws(new Error('Token inválido'));

            try {
                await authService.refreshToken('invalidRefreshToken');
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.equal('Refresh token inválido');
            }
        });
    });

    describe('logout', () => {
        it('debería cerrar sesión exitosamente', async () => {
            const mockUser = {
                _id: '123',
                refreshToken: 'validRefreshToken',
                save: sandbox.stub().resolves()
            };

            sandbox.stub(User, 'findById').resolves(mockUser);

            const result = await authService.logout('123');

            expect(result).to.be.true;
            expect(mockUser.refreshToken).to.be.null;
        });

        it('debería manejar usuario no encontrado', async () => {
            sandbox.stub(User, 'findById').resolves(null);

            const result = await authService.logout('nonexistent');

            expect(result).to.be.true;
        });
    });

    describe('changePassword', () => {
        it('debería cambiar la contraseña exitosamente', async () => {
            const mockUser = {
                _id: '123',
                password: 'oldHashedPassword',
                save: sandbox.stub().resolves()
            };

            sandbox.stub(User, 'findById').resolves(mockUser);
            sandbox.stub(bcrypt, 'compare').resolves(true);
            sandbox.stub(bcrypt, 'genSalt').resolves('salt');
            sandbox.stub(bcrypt, 'hash').resolves('newHashedPassword');

            const result = await authService.changePassword('123', 'oldPassword', 'newPassword123!');

            expect(result).to.be.true;
            expect(mockUser.password).to.equal('newHashedPassword');
        });

        it('debería fallar con contraseña actual incorrecta', async () => {
            const mockUser = {
                _id: '123',
                password: 'oldHashedPassword'
            };

            sandbox.stub(User, 'findById').resolves(mockUser);
            sandbox.stub(bcrypt, 'compare').resolves(false);

            try {
                await authService.changePassword('123', 'wrongPassword', 'newPassword123!');
                expect.fail('Debería haber lanzado un error');
            } catch (error) {
                expect(error.message).to.equal('Contraseña actual incorrecta');
            }
        });
    });
}); 