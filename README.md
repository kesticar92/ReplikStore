# ReplikStore

Sistema de gestión para ReplikStore, una plataforma moderna para la gestión de inventario y ventas.

## 🚀 Características

- Gestión de inventario
- Sistema de autenticación seguro
- API RESTful
- Base de datos SQLite
- Interfaz de usuario moderna

## 📋 Prerrequisitos

- Node.js (v14 o superior)
- npm (v6 o superior)

## 🔧 Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tuusuario/ReplikStore.git
   cd ReplikStore
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

## 🚀 Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

### Pruebas

```bash
npm test
```

## 📁 Estructura del Proyecto

```
ReplikStore/
├── backend/
│   ├── controllers/    # Controladores de la aplicación
│   ├── models/        # Modelos de datos
│   ├── routes/        # Rutas de la API
│   ├── basedeDatos/   # Archivos de base de datos
│   ├── app.js         # Configuración de Express
│   └── server.js      # Punto de entrada del servidor
├── UI/                # Interfaz de usuario
├── Assets/           # Recursos estáticos
└── simuladores/      # Simuladores y pruebas
```

## 🔐 Seguridad

- Autenticación mediante JWT
- Validación de datos con express-validator
- Variables de entorno para configuraciones sensibles
- CORS configurado para orígenes permitidos

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.