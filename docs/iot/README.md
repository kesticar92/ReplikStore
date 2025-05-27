# Documentación del Componente IoT

## Descripción
El componente IoT de ReplikStore maneja la comunicación y gestión de sensores físicos y virtuales, proporcionando una capa de abstracción para la integración con el sistema principal.

## Arquitectura

### Componentes Principales

#### 1. Gestor de Sensores
- Registro y monitoreo de dispositivos
- Calibración y mantenimiento
- Gestión de estados y alertas

#### 2. Protocolos de Comunicación
- MQTT para comunicación en tiempo real
- WebSocket para integración con frontend
- REST API para configuración

#### 3. Procesamiento de Datos
- Validación de datos
- Normalización
- Agregación

## Tipos de Sensores Soportados

### Sensores Físicos
- Temperatura
- Humedad
- Presencia
- Movimiento
- Peso
- RFID

### Sensores Virtuales
- Simulación de tráfico
- Predicción de demanda
- Análisis de comportamiento

## Configuración

### Archivo de Configuración
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
    }
  }
}
```

### Variables de Entorno
```bash
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
MQTT_TOPIC_PREFIX=replikstore/sensors
```

## Integración

### Conexión con Backend
1. Los sensores envían datos al broker MQTT
2. El backend procesa y almacena los datos
3. El frontend recibe actualizaciones en tiempo real

### Conexión con Gemelo Digital
1. Los datos de sensores se mapean a elementos 3D
2. Actualización en tiempo real de visualizaciones
3. Simulación de eventos basada en datos reales

## Desarrollo

### Agregar Nuevo Sensor
1. Definir tipo y características en `config/sensors.json`
2. Implementar driver en `iot/drivers/`
3. Agregar pruebas en `tests/iot/`
4. Documentar en `docs/iot/sensors/`

### Pruebas
```bash
# Ejecutar pruebas de IoT
npm run test:iot

# Ejecutar pruebas de integración
npm run test:integration
```

## Mantenimiento

### Monitoreo
- Estado de sensores
- Calidad de datos
- Latencia de comunicación

### Troubleshooting
1. Verificar conexión con broker MQTT
2. Validar configuración de sensores
3. Revisar logs en `logs/iot/`

## Seguridad

### Autenticación
- Certificados TLS para MQTT
- Tokens JWT para API
- Credenciales seguras

### Autorización
- Control de acceso por sensor
- Políticas de lectura/escritura
- Auditoría de operaciones

## Mejores Prácticas

### Desarrollo
1. Seguir estándares de codificación
2. Documentar cambios
3. Implementar pruebas unitarias
4. Mantener logs detallados

### Operación
1. Monitorear estado de sensores
2. Realizar mantenimiento preventivo
3. Actualizar firmware regularmente
4. Mantener backups de configuración 