const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const User = require('../models/user');

class AuthService {
    constructor() {
        this.secret = process.env.JWT_SECRET;
        if (!this.secret) {
            throw new Error('JWT_SECRET no está configurado');
        }
    }

    async login(email, password) {
        try {
            if (!email || !password) {
                throw new ValidationError('Email y contraseña son requeridos');
            }

            const user = await User.findOne({ email });
            if (!user) {
                throw new ValidationError('Credenciales inválidas');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new ValidationError('Credenciales inválidas');
            }

            if (user.status !== 'active') {
                throw new ValidationError('Usuario inactivo');
            }

            const token = this._generateToken(user);
            const refreshToken = this._generateRefreshToken(user);

            // Guardar refresh token
            user.refreshToken = refreshToken;
            await user.save();

            logger.info('Login exitoso', {
                userId: user._id,
                email: user.email,
                role: user.role
            });

            return {
                token,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            };
        } catch (error) {
            logger.error('Error en login:', {
                error: error.message,
                email
            });
            throw error;
        }
    }

    async register(userData) {
        try {
            const { email, password, name, role } = userData;

            // Validar campos requeridos
            if (!email || !password || !name) {
                throw new ValidationError('Todos los campos son requeridos');
            }

            // Verificar si el email ya existe
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new ValidationError('El email ya está registrado');
            }

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Crear usuario
            const user = new User({
                email,
                password: hashedPassword,
                name,
                role: role || 'user',
                status: 'active'
            });

            await user.save();

            logger.info('Usuario registrado exitosamente', {
                userId: user._id,
                email: user.email,
                role: user.role
            });

            return {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            };
        } catch (error) {
            logger.error('Error en registro:', {
                error: error.message,
                email: userData.email
            });
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            if (!refreshToken) {
                throw new ValidationError('Refresh token no proporcionado');
            }

            const decoded = jwt.verify(refreshToken, this.secret);
            const user = await User.findOne({
                _id: decoded.id,
                refreshToken
            });

            if (!user) {
                throw new ValidationError('Refresh token inválido');
            }

            if (user.status !== 'active') {
                throw new ValidationError('Usuario inactivo');
            }

            const newToken = this._generateToken(user);
            const newRefreshToken = this._generateRefreshToken(user);

            // Actualizar refresh token
            user.refreshToken = newRefreshToken;
            await user.save();

            return {
                token: newToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            logger.error('Error en refresh token:', {
                error: error.message
            });
            throw error;
        }
    }

    async logout(userId) {
        try {
            const user = await User.findById(userId);
            if (user) {
                user.refreshToken = null;
                await user.save();
            }

            logger.info('Logout exitoso', { userId });
            return true;
        } catch (error) {
            logger.error('Error en logout:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new ValidationError('Usuario no encontrado');
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                throw new ValidationError('Contraseña actual incorrecta');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            await user.save();

            logger.info('Contraseña actualizada exitosamente', { userId });
            return true;
        } catch (error) {
            logger.error('Error al cambiar contraseña:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    _generateToken(user) {
        return jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            this.secret,
            { expiresIn: '1h' }
        );
    }

    _generateRefreshToken(user) {
        return jwt.sign(
            { id: user._id },
            this.secret,
            { expiresIn: '7d' }
        );
    }
}

module.exports = new AuthService(); 