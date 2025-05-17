require('dotenv').config();
const app = require('./app');
const morgan = require('morgan');

const PORT = process.env.PORT || 3000;

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

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

// Manejo de rechazos de promesas no capturados
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Cerrando...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
