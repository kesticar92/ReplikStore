/**
 * Configuración para el entorno de staging de ReplikStore
 */

module.exports = {
  app: {
    name: 'ReplikStore',
    version: '1.0.0',
    port: 3000,
    env: 'staging',
    apiUrl: 'https://staging-api.replikstore.com',
    wsUrl: 'wss://staging-api.replikstore.com',
  },

  database: {
    mongodb: {
      uri: 'mongodb://mongodb:27017/replikstore_staging',
      user: 'admin',
      password: 'your-staging-password',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    redis: {
      url: 'redis://redis:6379',
      password: 'your-staging-password',
    },
  },

  auth: {
    jwt: {
      secret: 'your-staging-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 10,
    },
  },

  cors: {
    origin: 'https://staging.replikstore.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  logging: {
    level: 'info',
    format: 'combined',
    directory: 'logs',
  },

  email: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'staging@gmail.com',
    pass: 'your-staging-password',
  },

  unrealEngine: {
    projectPath: '/path/to/ReplikStore.uproject',
    editorPath: '/path/to/UnrealEditor',
  },

  iot: {
    mqtt: {
      broker: 'mqtt://staging-mqtt.replikstore.com:1883',
      username: 'your-staging-username',
      password: 'your-staging-password',
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
    path: '/path/to/backups/staging',
    retention: '7d',
  },

  cache: {
    ttl: 3600,
    maxItems: 5000,
  },

  rateLimit: {
    window: '15m',
    max: 500,
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
    secret: 'your-staging-session-secret',
    maxAge: 86400000,
  },

  websocket: {
    heartbeatInterval: 30000,
    maxPayload: 1048576,
  },

  apis: {
    stripe: {
      secretKey: 'your-staging-stripe-secret-key',
      publishableKey: 'your-staging-stripe-publishable-key',
    },
    twilio: {
      accountSid: 'your-staging-twilio-account-sid',
      authToken: 'your-staging-twilio-auth-token',
    },
  },

  analytics: {
    google: {
      id: 'your-staging-ga-id',
    },
    mixpanel: {
      token: 'your-staging-mixpanel-token',
    },
  },

  features: {
    beta: true,
    experimental: false,
  },

  debug: {
    enabled: false,
    colors: false,
    depth: 3,
  },
}; 