process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.PORT = '3001';
process.env.NOTIFY_EMAIL = 'test@example.com';
process.env.NOTIFY_SMS = '+1234567890';
process.env.NOTIFY_WEBHOOK = 'http://test.com/webhook'; 