/**
 * Configuración para el entorno de producción de ReplikStore
 */

module.exports = {
  app: {
    name: 'ReplikStore',
    version: '1.0.0',
    port: 3000,
    env: 'production',
    apiUrl: 'https://api.replikstore.com',
    wsUrl: 'wss://api.replikstore.com',
  },

  database: {
    mongodb: {
      uri: 'mongodb://mongodb:27017/replikstore_production',
      user: 'admin',
      password: 'your-production-password',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    redis: {
      url: 'redis://redis:6379',
      password: 'your-production-password',
    },
  },

  auth: {
    jwt: {
      secret: 'your-production-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 12,
    },
  },

  cors: {
    origin: 'https://replikstore.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  logging: {
    level: 'error',
    format: 'combined',
    directory: 'logs',
  },

  email: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'production@gmail.com',
    pass: 'your-production-password',
  },

  unrealEngine: {
    projectPath: '/path/to/ReplikStore.uproject',
    editorPath: '/path/to/UnrealEditor',
  },

  iot: {
    mqtt: {
      broker: 'mqtt://mqtt.replikstore.com:1883',
      username: 'your-production-username',
      password: 'your-production-password',
    },
  },

  monitoring: {
    prometheus: {
      port: 9090,
    },
    grafana: {
      port: 3000,
    },
  },

  backup: {
    path: '/path/to/backups/production',
    retention: '30d',
  },

  cache: {
    ttl: 3600,
    maxItems: 10000,
  },

  rateLimit: {
    window: '15m',
    max: 100,
  },

  security: {
    password: {
      minLength: 8,
      maxLength: 32,
    },
  },

  upload: {
    maxSize: '10mb',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },

  session: {
    secret: 'your-production-session-secret',
    maxAge: 86400000,
  },

  websocket: {
    heartbeatInterval: 30000,
    maxPayload: 1048576,
  },

  apis: {
    stripe: {
      secretKey: 'your-production-stripe-secret-key',
      publishableKey: 'your-production-stripe-publishable-key',
    },
    twilio: {
      accountSid: 'your-production-twilio-account-sid',
      authToken: 'your-production-twilio-auth-token',
    },
  },

  analytics: {
    google: {
      id: 'your-production-ga-id',
    },
    mixpanel: {
      token: 'your-production-mixpanel-token',
    },
  },

  features: {
    beta: false,
    experimental: false,
  },

  debug: {
    enabled: false,
    colors: false,
    depth: 2,
  },
}; 