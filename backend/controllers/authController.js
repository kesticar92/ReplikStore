const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');
const { logger } = require('../utils/logger');

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            
            res.json({
                success: true,
                message: 'Login exitoso',
                data: result
            });
        } catch (error) {
            logger.error('Error en login:', {
                error: error.message,
                email: req.body.email
            });
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const userData = req.body;
            const result = await authService.register(userData);
            
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: result
            });
        } catch (error) {
            logger.error('Error en registro:', {
                error: error.message,
                email: req.body.email
            });
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            
            res.json({
                success: true,
                message: 'Token actualizado exitosamente',
                data: result
            });
        } catch (error) {
            logger.error('Error en refresh token:', {
                error: error.message
            });
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const userId = req.user.id;
            await authService.logout(userId);
            
            res.json({
                success: true,
                message: 'Logout exitoso'
            });
        } catch (error) {
            logger.error('Error en logout:', {
                error: error.message,
                userId: req.user?.id
            });
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            
            await authService.changePassword(userId, currentPassword, newPassword);
            
            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            logger.error('Error al cambiar contraseña:', {
                error: error.message,
                userId: req.user?.id
            });
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId).select('-password -refreshToken');
            
            if (!user) {
                throw new ValidationError('Usuario no encontrado');
            }
            
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Error al obtener perfil:', {
                error: error.message,
                userId: req.user?.id
            });
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const updateData = req.body;
            
            // No permitir actualizar campos sensibles
            delete updateData.password;
            delete updateData.role;
            delete updateData.status;
            
            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password -refreshToken');
            
            if (!user) {
                throw new ValidationError('Usuario no encontrado');
            }
            
            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: user
            });
        } catch (error) {
            logger.error('Error al actualizar perfil:', {
                error: error.message,
                userId: req.user?.id
            });
            next(error);
        }
    }
}

module.exports = new AuthController(); 