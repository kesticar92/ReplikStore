require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const WebSocket = require('ws');
const http = require('http');
const morgan = require('morgan');

const sensorRoutes = require('./routes/sensorRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenar el servidor WebSocket en la app para acceso desde los controladores
app.set('wsServer', wss);

// Middleware
app.use(cors());
app.use(express.json());

// Configuración JWT
const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';
app.use(
    jwt({ 
        secret: jwtSecret, 
        algorithms: ['HS256'],
        credentialsRequired: false
    }).unless({ path: ['/api/auth/test-token'] })
);

// Rutas
app.use('/api/sensors', sensorRoutes);
app.use('/api/auth', authRoutes);

// Manejo de errores JWT
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            message: 'Token inválido o no proporcionado'
        });
    } else {
        next(err);
    }
});

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Cerrando...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Cerrando...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Configuración de WebSocket
const HEARTBEAT_INTERVAL = 30000;
const CLIENT_TIMEOUT = 45000;

// Manejar conexiones WebSocket
wss.on('connection', (ws) => {
    console.log('Nueva conexión WebSocket establecida');
    ws.isAlive = true;

    // Enviar mensaje de bienvenida inmediatamente
    try {
        const welcomeMessage = {
            type: 'welcome',
            message: 'Bienvenido a la conexión WebSocket del Digital Twin',
            timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(welcomeMessage));
        console.log('Mensaje de bienvenida enviado');

        // Enviar mensaje de prueba tipo security_event
        const testSecurityEvent = {
            type: 'security_event',
            message: '¡Conexión exitosa! Evento de seguridad de prueba.',
            timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(testSecurityEvent));
        console.log('Mensaje de prueba security_event enviado');
    } catch (error) {
        console.error('Error al enviar mensaje de bienvenida:', error);
    }

    // Manejar pings del cliente
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    // Verificar estado de la conexión periódicamente
    const pingInterval = setInterval(() => {
        if (ws.isAlive === false) {
            console.log('Cliente no responde, cerrando conexión');
            return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping(() => {});
    }, HEARTBEAT_INTERVAL);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Mensaje WebSocket recibido:', data);
            
            // Procesar mensaje según su tipo
            switch(data.type) {
                case 'sensor_update':
                    console.log('Procesando actualización de sensor:', data);
                    // Broadcast a todos los clientes
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            try {
                                client.send(JSON.stringify({
                                    ...data,
                                    timestamp: new Date().toISOString()
                                }));
                                console.log('Mensaje de actualización reenviado');
                            } catch (error) {
                                console.error('Error al reenviar mensaje:', error);
                            }
                        }
                    });
                    break;
                default:
                    console.log('Tipo de mensaje no soportado:', data.type);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Tipo de mensaje no soportado',
                        timestamp: new Date().toISOString()
                    }));
            }
        } catch (error) {
            console.error('Error al procesar mensaje WebSocket:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Formato de mensaje inválido',
                timestamp: new Date().toISOString()
            }));
        }
    });

    ws.on('close', () => {
        console.log('Conexión WebSocket cerrada');
        clearInterval(pingInterval);
    });

    ws.on('error', (error) => {
        console.error('Error en conexión WebSocket:', error);
        clearInterval(pingInterval);
    });
});

// Limpiar conexiones muertas periódicamente
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(() => {});
    });
}, CLIENT_TIMEOUT);

wss.on('close', () => {
    clearInterval(interval);
});

// Función para enviar actualizaciones a clientes
const broadcastUpdate = function(type, data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data }));
        }
    });
};

global.broadcastUpdate = broadcastUpdate;

// Solo iniciar el servidor si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        console.log(`🚀 Servidor corriendo en el puerto ${port}`);
    });
}

module.exports = server;