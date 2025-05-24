# Gemelo Digital - Tienda Física

Este proyecto implementa un gemelo digital de una tienda física utilizando Unreal Engine 5, con integración de sensores IoT simulados y visualización en tiempo real.

## Requisitos

- Unreal Engine 5.1 o superior
- Node.js 14.0 o superior
- Python 3.7 o superior
- Módulo `unreal` de Python (incluido con Unreal Engine)

## Estructura del Proyecto

```
MyProject2/
├── Content/
│   └── Blueprints/
│       ├── Core/
│       ├── Security/
│       ├── Inventory/
│       ├── Customer/
│       ├── Layout/
│       └── Help/
├── ws-server.js
├── test-ws-client.js
├── generate_blueprints.py
└── README.md
```

## Sistemas Principales

1. **Sistema de Seguridad**
   - Cámaras de seguridad con rotación y zoom
   - Detección de movimiento
   - Panel de control centralizado

2. **Sistema de Inventario**
   - Gestión de productos en tiempo real
   - Integración con sensores IoT
   - Alertas de stock bajo

3. **Sistema de Clientes Virtuales**
   - Simulación de comportamiento de compra
   - IA para toma de decisiones
   - Interacción con productos

4. **Sistema de Layout**
   - Editor de diseño de tienda
   - Validación de layouts
   - Función de deshacer/rehacer

5. **Sistema de Ayuda**
   - Manual interactivo
   - Tutoriales integrados
   - Soporte en tiempo real

## Configuración

1. **Servidor WebSocket**
   ```bash
   npm install ws
   node ws-server.js
   ```

2. **Cliente WebSocket**
   ```bash
   node test-ws-client.js
   ```

3. **Generación de Blueprints**
   - Abrir Unreal Engine
   - Ir a Window > Python Editor
   - Copiar y pegar el contenido de `generate_blueprints.py`
   - Ejecutar el script

## Uso del Gemelo Digital

1. **Iniciar el Proyecto**
   - Abrir el proyecto en Unreal Engine
   - Asegurarse que el servidor WebSocket esté corriendo
   - Iniciar el cliente WebSocket
   - Presionar Play en el editor

2. **Monitoreo de Sensores**
   - Los datos de los sensores se actualizan cada segundo
   - Visualización en tiempo real en el panel de control
   - Alertas automáticas configurables

3. **Control de Cámaras**
   - Uso de WASD para movimiento
   - Click derecho + arrastrar para rotación
   - Rueda del mouse para zoom

4. **Gestión de Layout**
   - Modo edición con tecla Tab
   - Arrastrar y soltar elementos
   - Guardar/cargar layouts

## Solución de Problemas

1. **Error de Conexión WebSocket**
   - Verificar que el puerto 3000 esté libre
   - Reiniciar el servidor
   - Comprobar firewall

2. **Problemas con Blueprints**
   - Recompilar todos los Blueprints
   - Verificar referencias circulares
   - Limpiar carpeta Saved/

3. **Rendimiento**
   - Ajustar intervalo de actualización de sensores
   - Reducir número de clientes virtuales
   - Optimizar calidad gráfica

## Contribución

Para contribuir al proyecto:
1. Fork del repositorio
2. Crear rama feature/fix
3. Commit de cambios
4. Push a la rama
5. Crear Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles. 