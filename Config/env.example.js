/**
 * Configuración de ejemplo para ReplikStore
 * Copiar este archivo como env.js y ajustar según el entorno
 */

module.exports = {
  // Configuración de la aplicación
  app: {
    name: 'ReplikStore',
    version: '1.0.0',
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    wsUrl: process.env.WS_URL || 'ws://localhost:3000',
  },

  // Configuración de la base de datos
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/replikstore',
      user: process.env.MONGODB_USER || 'admin',
      password: process.env.MONGODB_PASSWORD || 'password',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || 'password',
    },
  },

  // Configuración de autenticación
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRATION || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'),
    },
  },

  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'dev',
    directory: 'logs',
  },

  // Configuración de email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-password',
  },

  // Configuración de Unreal Engine
  unrealEngine: {
    projectPath: process.env.UE_PROJECT_PATH || '/path/to/ReplikStore.uproject',
    editorPath: process.env.UE_EDITOR_PATH || '/path/to/UnrealEditor',
  },

  // Configuración de IoT
  iot: {
    mqtt: {
      broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
      username: process.env.MQTT_USERNAME || 'your-username',
      password: process.env.MQTT_PASSWORD || 'your-password',
    },
  },

  // Configuración de monitoreo
  monitoring: {
    prometheus: {
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
    },
    grafana: {
      port: parseInt(process.env.GRAFANA_PORT || '3000'),
    },
  },

  // Configuración de backup
  backup: {
    path: process.env.BACKUP_PATH || '/path/to/backups',
    retention: process.env.BACKUP_RETENTION || '7d',
  },

  // Configuración de caché
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '5000'),
  },

  // Configuración de rate limiting
  rateLimit: {
    window: process.env.RATE_LIMIT_WINDOW || '15m',
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
  },

  // Configuración de seguridad
  security: {
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '32'),
    },
  },

  // Configuración de upload
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '5mb',
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif').split(','),
  },

  // Configuración de sesión
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
  },

  // Configuración de WebSocket
  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
    maxPayload: parseInt(process.env.WS_MAX_PAYLOAD || '1048576'),
  },

  // Configuración de APIs externas
  apis: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'your-stripe-publishable-key',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
      authToken: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
    },
  },

  // Configuración de analytics
  analytics: {
    google: {
      id: process.env.GOOGLE_ANALYTICS_ID || 'your-ga-id',
    },
    mixpanel: {
      token: process.env.MIXPANEL_TOKEN || 'your-mixpanel-token',
    },
  },

  // Feature flags
  features: {
    beta: process.env.ENABLE_BETA_FEATURES === 'true',
    experimental: process.env.ENABLE_EXPERIMENTAL_FEATURES === 'true',
  },

  // Configuración de debug
  debug: {
    enabled: process.env.DEBUG === 'true',
    colors: process.env.DEBUG_COLORS === 'true',
    depth: parseInt(process.env.DEBUG_DEPTH || '5'),
  },
}; 