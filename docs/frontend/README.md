# Documentación del Frontend

## Descripción
El frontend de ReplikStore está construido con React y TypeScript, proporcionando una interfaz de usuario moderna y responsiva para la gestión y visualización de datos en tiempo real.

## Arquitectura

### Componentes Principales

#### 1. Dashboard
- Visualización de métricas
- Gráficos en tiempo real
- Sistema de alertas
- Filtros y búsqueda

#### 2. Gestión de Dispositivos
- Lista de dispositivos
- Estado en tiempo real
- Configuración
- Mantenimiento

#### 3. Analytics
- Reportes personalizados
- Exportación de datos
- Visualizaciones avanzadas
- Predicciones

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   └── analytics/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── utils/
│   └── styles/
├── public/
└── dist/
```

## Componentes

### Dashboard
```typescript
// Dashboard.tsx
import { useMetrics } from '../hooks/useMetrics';
import { MetricsCard, Chart, AlertList } from '../components';

const Dashboard = () => {
  const { metrics, loading, error } = useMetrics();
  
  return (
    <div className="dashboard">
      <MetricsCard data={metrics} />
      <Chart data={metrics.history} />
      <AlertList alerts={metrics.alerts} />
    </div>
  );
};
```

### Gestión de Dispositivos
```typescript
// DeviceList.tsx
import { useDevices } from '../hooks/useDevices';
import { DeviceCard, StatusBadge } from '../components';

const DeviceList = () => {
  const { devices, updateDevice } = useDevices();
  
  return (
    <div className="device-list">
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          onUpdate={updateDevice}
        />
      ))}
    </div>
  );
};
```

## Estado Global

### Redux Store
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import devicesReducer from './slices/devicesSlice';
import metricsReducer from './slices/metricsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    devices: devicesReducer,
    metrics: metricsReducer,
    auth: authReducer,
  },
});
```

### Hooks Personalizados
```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = () => {
  const socket = useRef<Socket>();

  useEffect(() => {
    socket.current = io('ws://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  return socket.current;
};
```

## Estilos

### Theme
```typescript
// styles/theme.ts
export const theme = {
  colors: {
    primary: '#2196f3',
    secondary: '#f50057',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    // ...
  },
};
```

## Configuración

### Variables de Entorno
```bash
# API
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_EXPORT=true

# Analytics
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

## Desarrollo

### Instalación
```bash
# Instalar dependencias
npm install

# Desarrollo
npm start

# Producción
npm run build
```

### Pruebas
```bash
# Unitarias
npm test

# E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

## Despliegue

### Docker
```dockerfile
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### CI/CD
- GitHub Actions
- Tests automáticos
- Despliegue automático
- Monitoreo de rendimiento

## Optimización

### Rendimiento
- Code splitting
- Lazy loading
- Memoización
- Optimización de imágenes

### SEO
- Meta tags
- Sitemap
- Robots.txt
- Open Graph

## Accesibilidad

### WCAG 2.1
- Navegación por teclado
- Contraste de colores
- Textos alternativos
- ARIA labels

## Mejores Prácticas

### Código
1. Seguir guías de estilo
2. Documentar componentes
3. Implementar pruebas
4. Manejar errores

### UI/UX
1. Diseño responsivo
2. Feedback visual
3. Carga progresiva
4. Manejo de errores 