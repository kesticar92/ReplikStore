# Manual Operativo del Sistema

## 1. Inicio de Sesión / Cierre de Sesión

### Acceso al Sistema
- URL del sistema: `http://localhost:3001`
- El sistema requiere autenticación mediante token JWT
- No se permite el acceso sin token válido
- El sistema implementa protección contra tokens expirados

### Recuperación de Contraseña
- El sistema implementa un endpoint especial para pruebas: `/api/auth/test-token`
- Para usuarios normales, se debe implementar un proceso de recuperación seguro

### Cierre de Sesión Seguro
- El sistema maneja automáticamente la expiración de tokens
- Se recomienda cerrar la sesión explícitamente al terminar

## 2. Navegación General

### Estructura Principal
- API REST disponible en: `/api`
- WebSocket disponible en: `/ws`
- Panel de control principal accesible después de la autenticación

### Roles de Usuario
- Administrador: Acceso completo al sistema
- Viewer: Acceso limitado a consultas
- Cada rol tiene permisos específicos

## 3. Módulos Funcionales

### Gestión de Sensores
- Consulta de sensores: `GET /api/sensors/all`
- Agregar datos de sensores: `POST /api/sensors/data`
- Eliminación de sensores: `DELETE /api/sensors/{sensor_id}`

### Validación de Datos
El sistema implementa validaciones estrictas para:
- Formato de datos
- Tipos de datos
- Prevención de inyección SQL
- Protección contra datos malformados

### Monitoreo en Tiempo Real
- Conexión WebSocket para datos en tiempo real
- Requiere autenticación mediante token
- Validación de formato de mensajes

## 4. Operaciones Especiales

### Rate Limiting
- El sistema implementa límites de peticiones
- Protección contra ataques de fuerza bruta
- Límite de 150 peticiones por lote

### Seguridad
- Validación de tokens JWT
- Protección contra inyección SQL
- Validación de datos de entrada
- Autenticación WebSocket

## 📎 Anexos

### A. Glosario de Términos
- JWT: JSON Web Token, método de autenticación
- WebSocket: Protocolo para comunicación en tiempo real
- Rate Limiting: Limitación de peticiones

### B. Preguntas Frecuentes
1. ¿Qué hacer si el token expira?
   - Solicitar nuevo token de autenticación
   
2. ¿Cómo manejar errores 401?
   - Verificar que el token sea válido y no esté expirado

3. ¿Qué hacer si recibo error 429?
   - Reducir la frecuencia de peticiones

### C. Guías Rápidas
1. Autenticación:
   ```javascript
   headers: { 
       Authorization: `Bearer ${token}`,
       'Content-Type': 'application/json'
   }
   ```

2. Conexión WebSocket:
   ```javascript
   const ws = new WebSocket(`${WS_URL}?token=${validToken}`);
   ```

### D. Políticas de Seguridad
- No compartir tokens de acceso
- Cerrar sesión al terminar
- Respetar límites de peticiones
- Validar datos antes de enviar

### E. Formatos de Datos
Ejemplo de datos válidos para sensores:
```javascript
{
    sensor: 'test_sensor',
    tipo: 'temperatura',
    valor: 25,
    ubicacion: 'zona_test'
}
```

## ✅ Recomendaciones Finales
1. Mantener tokens seguros y no compartirlos
2. Implementar manejo de errores en el cliente
3. Respetar los límites de peticiones
4. Validar datos antes de enviar
5. Usar conexiones seguras (HTTPS/WSS) 