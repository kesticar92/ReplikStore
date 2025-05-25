require('dotenv').config();
const express = require('express');
const cors = require('cors');
const setupWebSocket = require('./websocket');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { app } = require('./app');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const inventoryRoutes = require('./routes/inventory');
const eventRoutes = require('./routes/event');
const mongoose = require('mongoose');
const helmet = require('helmet');
const notificationService = require('./services/notificationService');
const jwt = require('jsonwebtoken');
const notificationRoutes = require('./routes/notification');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/report');

const PORT = process.env.PORT || 4000;

// Configurar rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 peticiones por ventana
    message: {
        success: false,
        message: 'Demasiadas peticiones, por favor intente más tarde'
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(morgan('dev'));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "ReplkStore API Documentation"
}));

// Rutas
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);

// Manejo de errores
app.use(errorHandler);

let server = null;

const startServer = async () => {
    try {
        await connectDB();
        return new Promise((resolve) => {
            server = app.listen(PORT, () => {
                console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
                const wss = setupWebSocket(server);
                // Definir función global para emitir mensajes WebSocket
                global.broadcastUpdate = (type, data) => {
                    console.log('Iniciando broadcast de actualización...');
                    console.log('Tipo de mensaje:', type);
                    console.log('Datos a enviar:', data);
                    console.log('Número de clientes conectados:', wss.clients.size);
                    
                    const message = JSON.stringify({ type, data });
                    let clientsCount = 0;
                    
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            console.log('Enviando mensaje a cliente en estado OPEN');
                            client.send(message);
                            clientsCount++;
                        } else {
                            console.log('Cliente en estado:', client.readyState);
                        }
                    });
                    
                    console.log(`Mensaje enviado a ${clientsCount} clientes`);
                };
                process.on('SIGTERM', () => {
                    console.log('SIGTERM recibido. Cerrando servidor...');
                    server.close(() => {
                        console.log('Servidor cerrado');
                        process.exit(0);
                    });
                });
                logger.info(`Documentación API disponible en http://localhost:${PORT}/api-docs`);
                resolve(server);
            });
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    // Solo iniciar el servidor automáticamente si es el entrypoint principal
    startServer();
}

// Configurar WebSocket para notificaciones
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    // Extraer token de autenticación del header
    const token = req.headers['sec-websocket-protocol'];
    if (!token) {
        ws.close();
        return;
    }

    try {
        // Verificar token y obtener usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Registrar conexión del cliente
        notificationService.handleClientConnection(ws, userId);

        // Manejar desconexión
        ws.on('close', () => {
            notificationService.handleClientDisconnection(ws);
        });
    } catch (error) {
        logger.error('Error en conexión WebSocket:', error);
        ws.close();
    }
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido. Cerrando servidor...');
    server.close(() => {
        logger.info('Servidor cerrado');
        mongoose.connection.close(false, () => {
            logger.info('Conexión a MongoDB cerrada');
            process.exit(0);
        });
    });
});

// Middleware de auditoría para todas las rutas
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
        // Registrar la respuesta después de que se envíe
        res.on('finish', () => {
            const auditService = require('./services/auditService');
            auditService.logEvent({
                action: req.method.toLowerCase(),
                entity: req.path.split('/')[2] || 'system',
                entityId: req.params.id || new mongoose.Types.ObjectId(),
                user: req.user ? req.user._id : null,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                status: res.statusCode < 400 ? 'success' : 'failure',
                message: res.statusMessage,
                metadata: {
                    path: req.path,
                    method: req.method,
                    statusCode: res.statusCode
                }
            }).catch(err => logger.error('Error al registrar auditoría:', err));
        });
        return originalSend.apply(res, arguments);
    };
    next();
});

module.exports = { app, startServer };
