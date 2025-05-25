module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'test-secret-key'
  },
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
}; 