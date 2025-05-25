const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const { AuthorizationError } = require('../utils/errors');

const setupSecurityMiddleware = (app) => {
    // Protección básica de headers
    app.use(helmet());

    // Prevenir XSS attacks
    app.use(xss());

    // Prevenir HTTP Parameter Pollution
    app.use(hpp());

    // Sanitizar datos de MongoDB
    app.use(mongoSanitize());

    // Limitar tamaño de payload
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.auth || !req.auth.role) {
            throw new AuthorizationError('No tiene permisos para realizar esta acción');
        }

        if (!roles.includes(req.auth.role)) {
            throw new AuthorizationError('No tiene permisos para realizar esta acción');
        }

        next();
    };
};

const restrictToIP = (allowedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!allowedIPs.includes(clientIP)) {
            throw new AuthorizationError('Acceso no permitido desde esta IP');
        }
        next();
    };
};

const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        throw new AuthorizationError('API Key inválida');
    }
    next();
};

module.exports = {
    setupSecurityMiddleware,
    checkRole,
    restrictToIP,
    validateApiKey
}; 