const express = require('express');
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const path = require('path');
const { limiter } = require('./rateLimiter');

const setupMiddleware = (app) => {
    // Middleware básico
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(limiter);

    // Configuración de CORS
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : ['http://localhost:3000'];

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('No permitido por CORS'));
            }
        },
        credentials: true
    }));

    // Servir archivos estáticos
    app.use('/static', express.static(path.join(__dirname, '../../Assets')));

    // Protección JWT
    const jwtMiddleware = jwt({
        secret: process.env.JWT_SECRET || 'test-secret-key',
        algorithms: ['HS256'],
        credentialsRequired: true,
        requestProperty: 'auth'
    }).unless({
        path: [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/test-token',
            { url: /^\/static\/.*/, methods: ['GET'] }
        ]
    });

    app.use(jwtMiddleware);
};

module.exports = { setupMiddleware }; 