const express = require('express');
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const path = require('path');
const mongoose = require('mongoose');
const { limiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { setupMiddleware } = require('./middleware');

// Importar rutas
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensors');
const inventoryRoutes = require('./routes/inventory');

// Configuración de MongoDB
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';
        await mongoose.connect(mongoUri);
        console.log('MongoDB conectado');
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error);
        process.exit(1);
    }
};

// NO conectar aquí, solo exportar la función
// connectDB();

// Configuración de la aplicación
const app = express();

// Configuración de middleware básico
setupMiddleware(app);

// Configuración de rutas
app.use('/api', routes);

// Middleware para validar roles
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.auth || !req.auth.role) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      });
    }

    next();
  };
};

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/inventory', inventoryRoutes);

// Manejo de errores global
app.use(errorHandler);

// Exportar la app y la función de conexión
module.exports = { app, connectDB };
