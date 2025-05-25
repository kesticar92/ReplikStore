const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

class AuthMiddleware {
    constructor() {
        this.secret = process.env.JWT_SECRET;
        if (!this.secret) {
            throw new Error('JWT_SECRET no está configurado');
        }
    }

    static verifyToken(req, res, next) {
        try {
            const token = AuthMiddleware._extractToken(req);
            if (!token) {
                return res.status(401).json({
                    error: 'No token provided',
                    message: 'Se requiere un token de autenticación'
                });
            }
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = decoded;
            next();
        } catch (error) {
            const errorMessage = error.message || 'Error de autenticación';
            const errorName = error.name || 'AuthenticationError';
            logger.error('Error de autenticación:', {
                error: errorMessage,
                name: errorName,
                stack: error.stack
            });
            if (errorName === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    message: 'El token ha expirado'
                });
            }
            if (errorName === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'Token inválido'
                });
            }
            return res.status(500).json({
                error: 'Authentication error',
                message: 'Error en la autenticación'
            });
        }
    }

    static _extractToken(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) return null;
        return token;
    }

    requireRole = (role) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Usuario no autenticado'
                    });
                }

                if (req.user.role !== role) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tiene permisos para realizar esta acción'
                    });
                }

                next();
            } catch (error) {
                logger.error('Error de autorización:', {
                    error: error.message,
                    user: req.user?.id,
                    role: req.user?.role,
                    path: req.path,
                    method: req.method
                });

                res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
        };
    };

    requireRoles = (roles) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Usuario no autenticado'
                    });
                }

                if (!roles.includes(req.user.role)) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tiene permisos para realizar esta acción'
                    });
                }

                next();
            } catch (error) {
                logger.error('Error de autorización:', {
                    error: error.message,
                    user: req.user?.id,
                    role: req.user?.role,
                    path: req.path,
                    method: req.method
                });

                res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
        };
    };
}

const authMiddleware = new AuthMiddleware();
module.exports = {
    verifyToken: AuthMiddleware.verifyToken,
    requireRole: authMiddleware.requireRole,
    requireRoles: authMiddleware.requireRoles
}; 