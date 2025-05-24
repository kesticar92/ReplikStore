# Integración WebSocket

## Conexión

La conexión WebSocket está disponible en:
```
ws://localhost:3000/ws
```

## Mensajes

### Mensaje de Bienvenida
Al establecer la conexión, recibirás un mensaje de bienvenida:
```json
{
  "type": "welcome",
  "message": "Bienvenido a la conexión WebSocket del Digital Twin"
}
```

### Actualizaciones de Sensores
Cuando se actualizan los datos de un sensor, recibirás:
```json
{
  "type": "sensor_update",
  "data": {
    "sensor": "string",
    "tipo": "string",
    "valor": number,
    "ubicacion": "string"
  }
}
```

## Manejo de Errores

### Reconexión
El cliente debe implementar una lógica de reconexión automática en caso de pérdida de conexión.
Se recomienda un intervalo de reintento exponencial con un máximo de 30 segundos.

### Timeout
- Conexión inicial: 5 segundos
- Mensaje de bienvenida: 5 segundos
- Mensajes de actualización: Sin timeout

## Ejemplo de Implementación Cliente

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Conexión establecida');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch(message.type) {
    case 'welcome':
      console.log('Mensaje de bienvenida:', message.message);
      break;
    case 'sensor_update':
      console.log('Actualización de sensor:', message.data);
      break;
  }
};

ws.onerror = (error) => {
  console.error('Error en WebSocket:', error);
};

ws.onclose = () => {
  console.log('Conexión cerrada');
  // Implementar lógica de reconexión
};
``` 