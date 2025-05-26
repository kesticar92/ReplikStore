export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/replikstore',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'clave_secreta_por_defecto',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  swagger: {
    title: 'ReplikStore API',
    description: 'API para el sistema de gestión de tienda ReplikStore',
    version: '1.0',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  websocket: {
    port: parseInt(process.env.WS_PORT, 10) || 3001,
  },
  notifications: {
    email: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    },
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_PHONE_NUMBER,
    },
  },
}); 