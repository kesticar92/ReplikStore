# Documentación del Backend

## Descripción
El backend de ReplikStore está construido con NestJS y TypeScript, proporcionando una API robusta y escalable para la gestión de datos, autenticación y comunicación en tiempo real.

## Arquitectura

### Componentes Principales

#### 1. API REST
- Endpoints para gestión de recursos
- Validación de datos
- Documentación con Swagger

#### 2. WebSocket
- Comunicación en tiempo real
- Eventos del sistema
- Notificaciones

#### 3. Servicios
- Gestión de usuarios
- Procesamiento de datos
- Integración con IoT
- Análisis y reportes

## Estructura del Proyecto

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── devices/
│   │   ├── analytics/
│   │   └── notifications/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   └── interceptors/
│   └── utils/
├── test/
└── dist/
```

## API Endpoints

### Autenticación
```typescript
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Usuarios
```typescript
GET /users
POST /users
GET /users/:id
PUT /users/:id
DELETE /users/:id
```

### Dispositivos
```typescript
GET /devices
POST /devices
GET /devices/:id
PUT /devices/:id
DELETE /devices/:id
```

### Analytics
```typescript
GET /analytics/dashboard
GET /analytics/reports
POST /analytics/export
```

## Base de Datos

### MongoDB
- Colecciones principales
- Índices
- Relaciones
- Validación de esquemas

### Redis
- Caché
- Sesiones
- Colas de mensajes
- Pub/Sub

## WebSocket

### Eventos
```typescript
// Cliente
socket.on('device:update', (data) => {});
socket.on('alert:new', (data) => {});
socket.on('analytics:update', (data) => {});

// Servidor
socket.emit('device:status', data);
socket.emit('alert:broadcast', data);
```

### Autenticación
```typescript
// Conexión
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'jwt-token'
  }
});
```

## Seguridad

### Autenticación
- JWT
- OAuth2
- Refresh tokens
- Rate limiting

### Autorización
- Roles y permisos
- Guards
- Decoradores
- Políticas

## Configuración

### Variables de Entorno
```bash
# Aplicación
PORT=3000
NODE_ENV=development
API_PREFIX=/api/v1

# Base de datos
MONGODB_URI=mongodb://localhost:27017/replikstore
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Desarrollo

### Instalación
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### Pruebas
```bash
# Unitarias
npm run test

# E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## Despliegue

### Docker
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### CI/CD
- GitHub Actions
- Tests automáticos
- Despliegue automático
- Monitoreo

## Monitoreo

### Métricas
- Prometheus
- Grafana
- Health checks
- Logging

### Logs
- Winston
- Rotación de logs
- Niveles de log
- Formato estructurado

## Mejores Prácticas

### Código
1. Seguir guías de estilo
2. Documentar endpoints
3. Implementar pruebas
4. Manejar errores

### Seguridad
1. Validar inputs
2. Sanitizar datos
3. Implementar rate limiting
4. Mantener dependencias actualizadas 