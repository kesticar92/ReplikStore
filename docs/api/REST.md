# API REST Documentation

## Autenticación

### Obtener Token de Prueba
```http
POST /api/auth/test-token
```

### Endpoints de Sensores

#### Obtener Todos los Datos de Sensores
```http
GET /api/sensors/all
Headers:
  - Authorization: Bearer <token>
Roles permitidos: admin, operator, viewer
```

#### Obtener Último Valor de un Sensor
```http
GET /api/sensors/:sensor
Headers:
  - Authorization: Bearer <token>
Roles permitidos: admin, operator, viewer
```

#### Enviar Datos de Sensor
```http
POST /api/sensors/data
Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json
Body:
{
  "sensor": "string",
  "tipo": "string",
  "valor": number,
  "ubicacion": "string"
}
Roles permitidos: admin, operator
```

#### Actualizar Datos de Sensor
```http
PUT /api/sensors/:sensor
Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json
Body:
{
  "tipo": "string",
  "valor": number,
  "ubicacion": "string"
}
Roles permitidos: admin, operator
```

#### Eliminar Datos de Sensor
```http
DELETE /api/sensors/:sensor
Headers:
  - Authorization: Bearer <token>
Roles permitidos: admin
```

## Códigos de Respuesta

- 200: Operación exitosa
- 201: Recurso creado
- 400: Solicitud incorrecta
- 401: No autenticado
- 403: No autorizado
- 404: Recurso no encontrado
- 500: Error interno del servidor 