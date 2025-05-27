# Guía de Instalación

Esta guía proporciona instrucciones detalladas para instalar y configurar todos los componentes del sistema ReplikStore.

## Requisitos del Sistema

### Hardware Mínimo
- CPU: Intel Core i7 o equivalente
- RAM: 16GB mínimo
- GPU: NVIDIA GTX 1060 6GB o superior
- Almacenamiento: 50GB de espacio libre

### Software Requerido
- Sistema Operativo: Windows 10/11, macOS 10.15+, o Ubuntu 20.04+
- Node.js >= 16.x
- MongoDB >= 4.4
- Redis >= 6.0
- Unreal Engine 5.0+
- Python 3.8+
- Git

## Instalación del Backend

1. Clonar el repositorio:
```bash
git clone https://github.com/kesticar92/ReplikStore.git
cd ReplikStore/backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Iniciar la base de datos:
```bash
# MongoDB
mongod --dbpath /ruta/a/tu/directorio/datos

# Redis
redis-server
```

5. Iniciar el servidor:
```bash
npm run start:dev
```

## Instalación del Frontend

1. Navegar al directorio del frontend:
```bash
cd ../frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Iniciar el servidor de desarrollo:
```bash
npm start
```

## Configuración del Gemelo Digital (Unreal Engine)

1. Abrir Unreal Engine 5
2. Abrir el proyecto:
   - File > Open Project
   - Navegar a `ReplikStore/UnrealEngine/ReplikStore.uproject`
   - Click en "Open"

3. Configurar el proyecto:
   - Abrir Project Settings
   - Configurar WebSocket Server URL
   - Configurar credenciales de autenticación

4. Compilar el proyecto:
   - Build > Build Project

## Configuración de Sensores IoT

1. Configurar el archivo de sensores:
```bash
cd backend
cp config/sensors.example.json config/sensors.json
```

2. Editar la configuración de sensores según tus necesidades:
```json
{
  "sensors": {
    "temperature": {
      "min": -10,
      "max": 40,
      "unit": "°C",
      "updateInterval": 60
    },
    "humidity": {
      "min": 0,
      "max": 100,
      "unit": "%",
      "updateInterval": 60
    },
    "occupancy": {
      "min": 0,
      "max": 100,
      "unit": "personas",
      "updateInterval": 30
    }
  }
}
```

## Verificación de la Instalación

1. Verificar el backend:
```bash
curl http://localhost:3000/health
```

2. Verificar el frontend:
- Abrir http://localhost:3001 en tu navegador
- Deberías ver la página de inicio

3. Verificar el Gemelo Digital:
- Ejecutar el proyecto en Unreal Engine
- Verificar la conexión WebSocket
- Comprobar la visualización de datos

## Solución de Problemas Comunes

### Backend no inicia
- Verificar que MongoDB y Redis estén ejecutándose
- Comprobar las variables de entorno
- Revisar los logs en `logs/backend.log`

### Frontend no se conecta al backend
- Verificar la URL del backend en `.env`
- Comprobar que el backend esté ejecutándose
- Revisar la consola del navegador para errores

### Gemelo Digital no recibe datos
- Verificar la configuración de WebSocket
- Comprobar las credenciales de autenticación
- Revisar los logs de Unreal Engine

## Actualización del Sistema

1. Actualizar el código:
```bash
git pull origin main
```

2. Actualizar dependencias:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Recompilar el Gemelo Digital:
- Abrir el proyecto en Unreal Engine
- Build > Build Project

## Soporte

Si encuentras problemas durante la instalación:
1. Revisar la sección de Solución de Problemas
2. Consultar los logs en el directorio `logs/`
3. Abrir un issue en el repositorio
4. Contactar al equipo de soporte 