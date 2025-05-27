# Guía de Contribución

¡Gracias por tu interés en contribuir a ReplikStore! Este documento proporciona las pautas y el proceso para contribuir al proyecto.

## Índice
1. [Código de Conducta](#código-de-conducta)
2. [¿Cómo Contribuir?](#cómo-contribuir)
3. [Proceso de Desarrollo](#proceso-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Pruebas](#pruebas)
6. [Documentación](#documentación)
7. [Revisión de Código](#revisión-de-código)

## Código de Conducta

Al participar en este proyecto, aceptas mantener un ambiente respetuoso y profesional. Por favor:

- Sé respetuoso con otros contribuidores
- Acepta críticas constructivas
- Enfócate en lo mejor para la comunidad
- Muestra empatía hacia otros miembros

## ¿Cómo Contribuir?

### 1. Reportar Bugs

Si encuentras un bug, por favor:

1. Verifica si ya existe un issue reportado
2. Usa el template de bug report
3. Incluye pasos para reproducir
4. Describe el comportamiento esperado
5. Adjunta logs o capturas de pantalla si es relevante

### 2. Sugerir Mejoras

Para sugerir nuevas características:

1. Verifica si ya existe una propuesta similar
2. Usa el template de feature request
3. Describe el problema que resuelve
4. Explica por qué es útil
5. Propón una solución

### 3. Contribuir Código

Para contribuir código:

1. Fork el repositorio
2. Crea una rama feature
3. Haz tus cambios
4. Sigue los estándares de código
5. Escribe pruebas
6. Actualiza la documentación
7. Crea un pull request

## Proceso de Desarrollo

### 1. Configuración del Entorno

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/replikstore.git

# Instalar dependencias
cd replikstore
npm install

# Configurar variables de entorno
cp .env.example .env
```

### 2. Flujo de Trabajo

1. **Crear una rama**
   ```bash
   git checkout -b feature/nombre-de-la-feature
   ```

2. **Desarrollar**
   - Sigue los estándares de código
   - Escribe pruebas
   - Actualiza documentación

3. **Commit**
   ```bash
   git commit -m "feat: descripción de los cambios"
   ```

4. **Push**
   ```bash
   git push origin feature/nombre-de-la-feature
   ```

5. **Pull Request**
   - Usa el template de PR
   - Describe los cambios
   - Referencia issues relacionados

## Estándares de Código

### JavaScript/TypeScript

- Usa ESLint y Prettier
- Sigue el estilo de código del proyecto
- Documenta funciones y clases
- Usa tipos en TypeScript

```typescript
// Ejemplo de código
interface User {
  id: string;
  name: string;
}

class UserService {
  /**
   * Obtiene un usuario por ID
   * @param id - ID del usuario
   * @returns Promise<User>
   */
  async getUser(id: string): Promise<User> {
    // Implementación
  }
}
```

### Unreal Engine

- Sigue las convenciones de Unreal Engine
- Documenta Blueprints
- Usa nombres descriptivos
- Organiza assets en carpetas

## Pruebas

### Backend

```typescript
// Unit Tests
describe('UserService', () => {
  it('should create user', async () => {
    // Test implementation
  });
});

// E2E Tests
describe('User API', () => {
  it('should handle user creation', async () => {
    // Test implementation
  });
});
```

### Frontend

```typescript
// Component Tests
describe('UserComponent', () => {
  it('should render user data', () => {
    // Test implementation
  });
});
```

### Unreal Engine

- Pruebas de funcionalidad
- Pruebas de rendimiento
- Pruebas de integración

## Documentación

### Código

- Documenta funciones y clases
- Explica lógica compleja
- Mantén comentarios actualizados

### API

- Documenta endpoints
- Incluye ejemplos
- Describe parámetros

### Unreal Engine

- Documenta Blueprints
- Explica lógica de gameplay
- Mantén documentación de assets

## Revisión de Código

### Proceso

1. **Revisión Inicial**
   - Verifica estándares de código
   - Revisa cobertura de pruebas
   - Verifica documentación

2. **Feedback**
   - Proporciona comentarios constructivos
   - Sugiere mejoras
   - Aclara dudas

3. **Aprobación**
   - Verifica cambios
   - Asegura calidad
   - Aprueba merge

### Checklist

- [ ] Código sigue estándares
- [ ] Pruebas pasan
- [ ] Documentación actualizada
- [ ] No hay conflictos
- [ ] Cambios son necesarios
- [ ] Código es mantenible

## Licencia

Al contribuir, aceptas que tu código será licenciado bajo la misma licencia del proyecto.

## Contacto

Para preguntas o dudas:

- Email: soporte@replikstore.com
- Issues: GitHub Issues
- Discord: [Link al servidor] 