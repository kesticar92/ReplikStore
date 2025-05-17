const express = require('express');
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// Middleware de seguridad y utilidades
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/static', express.static(path.join(__dirname, '../Assets')));

// Protección JWT para rutas protegidas
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  algorithms: ['HS256'],
}).unless({
  path: [
    '/api/auth/login',
    '/api/auth/register',
    { url: /^\/static\/.*/, methods: ['GET'] }
  ]
});

app.use('/api', jwtMiddleware);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
