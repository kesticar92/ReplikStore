# ReplikStore - Sistema de Gemelo Digital para Tiendas

ReplikStore es un sistema integral de gemelo digital que permite la simulación, monitoreo y análisis de tiendas físicas en tiempo real, combinando tecnologías de IoT, Unreal Engine y análisis de datos.

## 🏗️ Arquitectura del Sistema

El sistema está compuesto por tres componentes principales:

### 1. Backend (NestJS)
- **API REST**: Endpoints para gestión de dispositivos, inventario y análisis
- **WebSocket**: Comunicación en tiempo real con dispositivos IoT y clientes
- **Servicios Principales**:
  - Simulación de datos
  - Gestión de alertas
  - Monitoreo de métricas
  - Sistema de notificaciones
  - Gestión de inventario

### 2. Frontend (React)
- Dashboard interactivo para visualización de datos
- Panel de control para gestión de dispositivos
- Visualización de métricas en tiempo real
- Sistema de alertas y notificaciones

### 3. Gemelo Digital (Unreal Engine)
- Representación 3D de la tienda
- Visualización de datos en tiempo real
- Simulación de flujo de clientes
- Integración con sensores IoT

## 🚀 Características Principales

### Simulación y Monitoreo
- Generación de datos realistas para sensores
- Simulación de patrones de comportamiento de clientes
- Monitoreo en tiempo real de métricas clave
- Sistema de alertas configurable

### Gestión de Inventario
- Tracking en tiempo real de productos
- Alertas de stock bajo
- Análisis de rotación de inventario
- Predicción de demanda

### Análisis y Reportes
- Métricas de rendimiento en tiempo real
- Análisis de patrones de compra
- Reportes personalizables
- Visualización de datos históricos

### Integración IoT
- Soporte para múltiples tipos de sensores
- Protocolos de comunicación seguros
- Gestión de dispositivos
- Calibración y mantenimiento

## 🛠️ Tecnologías Utilizadas

- **Backend**: NestJS, TypeScript, WebSocket
- **Frontend**: React, TypeScript, Material-UI
- **Base de Datos**: MongoDB, Redis
- **Gemelo Digital**: Unreal Engine 5
- **IoT**: MQTT, WebSocket
- **DevOps**: Docker, GitHub Actions

## 📦 Instalación

### Requisitos Previos
- Node.js >= 16
- MongoDB
- Redis
- Unreal Engine 5
- Python 3.8+

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Gemelo Digital
1. Abrir el proyecto en Unreal Engine 5
2. Compilar el proyecto
3. Ejecutar la aplicación

## 🔧 Configuración

### Variables de Entorno
Crear un archivo `.env` en el directorio backend:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/replikstore
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

### Configuración de Sensores
Los sensores se configuran a través del archivo `config/sensors.json`:
```json
{
  "sensors": {
    "temperature": {
      "min": -10,
      "max": 40,
      "unit": "°C"
    },
    "humidity": {
      "min": 0,
      "max": 100,
      "unit": "%"
    }
  }
}
```

## 📚 Documentación

La documentación detallada se encuentra en el directorio `docs/`:
- [Guía de Instalación](docs/installation.md)
- [Manual de Usuario](docs/user-manual.md)
- [API Reference](docs/api-reference.md)
- [Guía de Desarrollo](docs/development.md)

## 🤝 Contribución

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte, por favor abrir un issue en el repositorio o contactar al equipo de desarrollo.

## Configuración

El proyecto utiliza una estructura de configuración modular basada en entornos. La configuración se encuentra en el directorio `config/` y sigue el siguiente patrón:

```
config/
├── env.example.js     # Plantilla de ejemplo con valores por defecto
├── env.development.js # Configuración de desarrollo estándar
├── env.local.js      # Configuración de desarrollo local (opcional)
├── env.test.js       # Configuración de pruebas
├── env.staging.js    # Configuración de staging
├── env.production.js # Configuración de producción
└── index.js          # Cargador de configuración
```

### Entornos

- **Development**: Configuración para desarrollo local
  - Usa `env.local.js` si existe, de lo contrario usa `env.development.js`
  - Configuración optimizada para desarrollo con debugging habilitado
  - Feature flags activados para testing

- **Test**: Configuración para pruebas
  - Base de datos y servicios aislados
  - Configuración mínima para pruebas
  - Logging reducido

- **Staging**: Configuración para pre-producción
  - Similar a producción pero con debugging limitado
  - Feature flags beta habilitados
  - Monitoreo activo

- **Production**: Configuración para producción
  - Seguridad máxima
  - Sin debugging
  - Sin feature flags experimentales
  - Monitoreo completo

### Uso

Para usar la configuración en tu código:

```javascript
const config = require('./config');

// La configuración se cargará automáticamente según el entorno
console.log(config.app.name);
console.log(config.database.mongodb.uri);
```

### Variables de Entorno

La configuración puede ser sobrescrita usando variables de entorno. Las variables disponibles son:

```bash
# Aplicación
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000

# Base de datos
MONGODB_URI=mongodb://localhost:27017/replikstore
MONGODB_USER=admin
MONGODB_PASSWORD=password
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=password

# Autenticación
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=30d
BCRYPT_SALT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FORMAT=dev

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Unreal Engine
UE_PROJECT_PATH=/path/to/ReplikStore.uproject
UE_EDITOR_PATH=/path/to/UnrealEditor

# IoT
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password

# Monitoreo
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Backup
BACKUP_PATH=/path/to/backups
BACKUP_RETENTION=7d

# Caché
CACHE_TTL=3600
CACHE_MAX_ITEMS=5000

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=1000

# Seguridad
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=32

# Upload
UPLOAD_MAX_SIZE=5mb
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif

# Sesión
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=86400000

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_PAYLOAD=1048576

# APIs
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Analytics
GOOGLE_ANALYTICS_ID=your-ga-id
MIXPANEL_TOKEN=your-mixpanel-token

# Feature Flags
ENABLE_BETA_FEATURES=true
ENABLE_EXPERIMENTAL_FEATURES=true

# Debug
DEBUG=true
DEBUG_COLORS=true
DEBUG_DEPTH=5
```

### Desarrollo Local

Para desarrollo local:

1. Copia `env.example.js` a `env.local.js`
2. Ajusta los valores según tu entorno local
3. El sistema cargará automáticamente `env.local.js` en desarrollo

### Seguridad

- Nunca commitees archivos de configuración con credenciales reales
- Usa variables de entorno para valores sensibles
- Mantén `env.local.js` en `.gitignore`
- Usa diferentes credenciales para cada entorno 