const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 peticiones por ventana por IP
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos'
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // límite de 5 intentos de login por hora por IP
    message: {
        success: false,
        message: 'Demasiados intentos de login, por favor intente de nuevo después de 1 hora'
    }
});

module.exports = {
    apiLimiter,
    authLimiter
}; 