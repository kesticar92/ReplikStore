const express = require('express');
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const path = require('path');
const promClient = require('prom-client');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const sensorRoutes = require('./routes/sensorRoutes');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Configuración de métricas Prometheus
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

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

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Servir archivos estáticos
app.use('/static', express.static(path.join(__dirname, '../Assets')));

// Rutas públicas primero
app.use('/api/auth', authRoutes);

// Protección JWT para rutas protegidas
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  algorithms: ['HS256'],
  credentialsRequired: true,
  requestProperty: 'auth',
  getToken: function fromHeaderOrQuerystring(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
}).unless({
  path: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/test-token',
    '/metrics',
    '/api-docs',
    '/api-docs/*',
    { url: /^\/static\/.*/, methods: ['GET'] }
  ]
});

// Middleware de autenticación
app.use('/api', jwtMiddleware);

// Middleware de verificación de roles
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
    
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para esta operación'
      });
    }
    next();
  };
};

// Rutas protegidas con roles
app.use('/api/products', checkRole(['admin', 'operator']), productRoutes);
app.use('/api/inventory', checkRole(['admin', 'operator']), inventoryRoutes);
app.use('/api/sensors', checkRole(['admin', 'operator', 'viewer']), sensorRoutes);
app.use('/api/analytics', checkRole(['admin', 'viewer']), analyticsRoutes);

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics);
});

// Manejo de errores de autenticación
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Token no válido o no proporcionado'
    });
  }
  next(err);
});

// Manejo general de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
