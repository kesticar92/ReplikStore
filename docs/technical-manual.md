# Manual Técnico

Este manual proporciona información técnica detallada para desarrolladores que trabajan con el sistema ReplikStore.

## Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Componentes Principales](#componentes-principales)
3. [APIs y Endpoints](#apis-y-endpoints)
4. [Base de Datos](#base-de-datos)
5. [Integración con IoT](#integración-con-iot)
6. [Gemelo Digital](#gemelo-digital)
7. [Seguridad](#seguridad)
8. [Despliegue](#despliegue)

## Arquitectura del Sistema

### Diagrama de Arquitectura
```
[Cliente Web] <-> [Frontend (React)] <-> [Backend (NestJS)] <-> [Base de Datos]
                                                              [Redis Cache]
                                                              [Sensores IoT]
                                                              [Gemelo Digital]
```

### Componentes Principales
1. **Frontend (React)**
   - Dashboard interactivo
   - Visualización de datos
   - Gestión de usuarios
   - Configuración del sistema

2. **Backend (NestJS)**
   - API REST
   - WebSocket Server
   - Procesamiento de datos
   - Gestión de sensores

3. **Base de Datos**
   - MongoDB (datos principales)
   - Redis (caché y tiempo real)

4. **Gemelo Digital (Unreal Engine)**
   - Visualización 3D
   - Simulación de clientes
   - Integración con sensores

## Componentes Principales

### Frontend
```typescript
// Estructura de directorios
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── utils/
```

#### Tecnologías Utilizadas
- React 18
- TypeScript
- Material-UI
- Redux Toolkit
- Socket.io-client

### Backend
```typescript
// Estructura de directorios
backend/
├── src/
│   ├── modules/
│   ├── services/
│   ├── controllers/
│   ├── dto/
│   └── entities/
```

#### Tecnologías Utilizadas
- NestJS
- TypeScript
- MongoDB
- Redis
- Socket.io

## APIs y Endpoints

### REST API

#### Autenticación
```typescript
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

#### Sensores
```typescript
GET /api/sensors
POST /api/sensors
PUT /api/sensors/:id
DELETE /api/sensors/:id
```

#### Inventario
```typescript
GET /api/inventory
POST /api/inventory
PUT /api/inventory/:id
DELETE /api/inventory/:id
```

### WebSocket API

#### Eventos
```typescript
// Conexión
socket.on('connect', () => {});

// Datos de sensores
socket.on('sensor:data', (data) => {});

// Alertas
socket.on('alert:new', (alert) => {});
```

## Base de Datos

### Esquemas Principales

#### Sensor
```typescript
interface Sensor {
  id: string;
  type: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  status: string;
  lastReading: {
    value: number;
    timestamp: Date;
  };
}
```

#### Inventario
```typescript
interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  location: string;
  lastUpdated: Date;
}
```

### Índices
```typescript
// MongoDB
db.sensors.createIndex({ "location": "2dsphere" });
db.inventory.createIndex({ "productId": 1 });
```

## Integración con IoT

### Protocolos Soportados
- MQTT
- HTTP
- WebSocket
- CoAP

### Configuración de Sensores
```json
{
  "sensor": {
    "id": "sensor-001",
    "type": "temperature",
    "protocol": "mqtt",
    "config": {
      "broker": "mqtt://localhost:1883",
      "topic": "sensors/temperature",
      "interval": 5000
    }
  }
}
```

## Gemelo Digital

### Estructura del Proyecto
```
ReplikStore/
├── Content/
│   ├── Maps/
│   ├── Blueprints/
│   └── Materials/
├── Source/
│   ├── ReplikStore/
│   └── ReplikStoreEditor/
└── Config/
```

### Integración con Backend
```cpp
// WebSocket Client
UWebSocketClient::Connect(FString URL)
{
    // Implementación
}

// Procesamiento de datos
void AStoreManager::ProcessSensorData(const FString& Data)
{
    // Implementación
}
```

## Seguridad

### Autenticación
```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }
}
```

### Autorización
```typescript
// Roles Guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## Despliegue

### Requisitos del Sistema
- Node.js 18+
- MongoDB 6+
- Redis 7+
- Unreal Engine 5.1+

### Variables de Entorno
```env
# Backend
PORT=3000
MONGODB_URI=mongodb://localhost:27017/replikstore
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key

# Frontend
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
```

### Docker
```dockerfile
# Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start:prod"]

# Frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
```

## Desarrollo

### Flujo de Trabajo
1. Crear rama feature
2. Desarrollar funcionalidad
3. Escribir pruebas
4. Crear pull request
5. Code review
6. Merge a main

### Convenciones de Código
- ESLint para JavaScript/TypeScript
- Prettier para formateo
- Conventional Commits
- Semantic Versioning

### Pruebas
```typescript
// Unit Tests
describe('SensorService', () => {
  it('should process sensor data', () => {
    // Test implementation
  });
});

// E2E Tests
describe('Sensor Integration', () => {
  it('should handle sensor data flow', () => {
    // Test implementation
  });
});
```

## Mantenimiento

### Monitoreo
- Prometheus para métricas
- Grafana para visualización
- ELK Stack para logs

### Logs
```typescript
// Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Backup
```bash
# MongoDB
mongodump --uri="mongodb://localhost:27017/replikstore" --out=/backup

# Redis
redis-cli SAVE
```

## Soporte

### Herramientas de Desarrollo
- VS Code
- Postman
- MongoDB Compass
- Redis Commander

### Recursos
- Documentación API
- Diagramas de arquitectura
- Guías de contribución
- Base de conocimientos 