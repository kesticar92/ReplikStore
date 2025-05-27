/**
 * Configuración para el entorno de desarrollo de ReplikStore
 */

module.exports = {
  app: {
    name: 'ReplikStore',
    version: '1.0.0',
    port: 3000,
    env: 'development',
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
  },

  database: {
    mongodb: {
      uri: 'mongodb://localhost:27017/replikstore_development',
      user: 'admin',
      password: 'development-password',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    redis: {
      url: 'redis://localhost:6379',
      password: 'development-password',
    },
  },

  auth: {
    jwt: {
      secret: 'development-secret-key',
      expiresIn: '24h',
      refreshExpiresIn: '30d',
    },
    bcrypt: {
      saltRounds: 10,
    },
  },

  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  logging: {
    level: 'debug',
    format: 'dev',
    directory: 'logs',
  },

  email: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'development@gmail.com',
    pass: 'development-password',
  },

  unrealEngine: {
    projectPath: '/path/to/ReplikStore.uproject',
    editorPath: '/path/to/UnrealEditor',
  },

  iot: {
    mqtt: {
      broker: 'mqtt://localhost:1883',
      username: 'development-username',
      password: 'development-password',
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
    path: '/path/to/backups/development',
    retention: '7d',
  },

  cache: {
    ttl: 3600,
    maxItems: 5000,
  },

  rateLimit: {
    window: '15m',
    max: 1000,
  },

  security: {
    password: {
      minLength: 8,
      maxLength: 32,
    },
  },

  upload: {
    maxSize: '5mb',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },

  session: {
    secret: 'development-session-secret',
    maxAge: 86400000,
  },

  websocket: {
    heartbeatInterval: 30000,
    maxPayload: 1048576,
  },

  apis: {
    stripe: {
      secretKey: 'development-stripe-secret-key',
      publishableKey: 'development-stripe-publishable-key',
    },
    twilio: {
      accountSid: 'development-twilio-account-sid',
      authToken: 'development-twilio-auth-token',
    },
  },

  analytics: {
    google: {
      id: 'development-ga-id',
    },
    mixpanel: {
      token: 'development-mixpanel-token',
    },
  },

  features: {
    beta: true,
    experimental: true,
  },

  debug: {
    enabled: true,
    colors: true,
    depth: 5,
  },
}; 