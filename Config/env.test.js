/**
 * Configuración para el entorno de pruebas de ReplikStore
 */

module.exports = {
  app: {
    name: 'ReplikStore',
    version: '1.0.0',
    port: 3001,
    env: 'test',
    apiUrl: 'http://localhost:3001',
    wsUrl: 'ws://localhost:3001',
  },

  database: {
    mongodb: {
      uri: 'mongodb://localhost:27017/replikstore_test',
      user: 'admin',
      password: 'test-password',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    redis: {
      url: 'redis://localhost:6379',
      password: 'test-password',
    },
  },

  auth: {
    jwt: {
      secret: 'test-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 4,
    },
  },

  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  logging: {
    level: 'error',
    format: 'dev',
    directory: 'logs',
  },

  email: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'test@gmail.com',
    pass: 'test-password',
  },

  unrealEngine: {
    projectPath: '/path/to/ReplikStore.uproject',
    editorPath: '/path/to/UnrealEditor',
  },

  iot: {
    mqtt: {
      broker: 'mqtt://localhost:1883',
      username: 'test-username',
      password: 'test-password',
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
    path: '/path/to/backups/test',
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
    maxSize: '1mb',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },

  session: {
    secret: 'test-session-secret',
    maxAge: 3600000,
  },

  websocket: {
    heartbeatInterval: 5000,
    maxPayload: 1048576,
  },

  apis: {
    stripe: {
      secretKey: 'test-stripe-secret-key',
      publishableKey: 'test-stripe-publishable-key',
    },
    twilio: {
      accountSid: 'test-twilio-account-sid',
      authToken: 'test-twilio-auth-token',
    },
  },

  analytics: {
    google: {
      id: 'test-ga-id',
    },
    mixpanel: {
      token: 'test-mixpanel-token',
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