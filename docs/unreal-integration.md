# Integración con Unreal Engine 5.5

Este documento describe cómo integrar el gemelo digital con Unreal Engine 5.5.

## Requisitos

- Unreal Engine 5.5
- Visual Studio 2019/2022 (para Windows) o Xcode (para macOS)
- Plugin WebSocket habilitado en el proyecto

## Configuración del Proyecto

1. Copiar los archivos de componentes:
   - `WebSocketComponent.h` y `.cpp`
   - `SensorManagerComponent.h` y `.cpp`
   a la carpeta `Source/WebSocket` de tu proyecto.

2. Agregar las dependencias al archivo `.Build.cs`:
```csharp
PublicDependencyModuleNames.AddRange(new string[] { 
    "Core", 
    "CoreUObject", 
    "Engine", 
    "WebSockets", 
    "Json", 
    "JsonUtilities" 
});
```

## Uso en Blueprint

1. Agregar WebSocketComponent a tu actor:
   - En el Blueprint, añade el componente "WebSocket Component"
   - Configura la URL del WebSocket y el token JWT

2. Agregar SensorManagerComponent:
   - Añade el componente "Sensor Manager Component"
   - Conecta con el WebSocketComponent en BeginPlay

3. Ejemplo de configuración en Blueprint:
```
Event BeginPlay
-> Get WebSocket Component
-> Connect (URL: "ws://localhost:3000/ws", Token: "your-jwt-token")
-> Get Sensor Manager Component
-> Initialize (WebSocket: WebSocket Component Reference)
```

## Recepción de Datos

El SensorManagerComponent proporciona varios eventos y funciones:

1. Eventos:
   - OnSensorDataUpdated: Se dispara cuando se reciben nuevos datos
   - OnWebSocketConnected: Conexión establecida
   - OnWebSocketError: Error en la conexión

2. Funciones:
   - RequestSensorData: Solicita datos de un sensor específico
   - GetAllSensorData: Obtiene todos los datos de sensores actuales

## Visualización 3D

Para visualizar los datos en el entorno 3D:

1. Crear un Blueprint que represente cada sensor
2. Subscribirse a OnSensorDataUpdated
3. Actualizar la visualización según el tipo de sensor:
   - Temperatura: Color o efectos de partículas
   - Movimiento: Animaciones
   - Ocupación: Visibilidad o materiales

## Ejemplo de Uso

```cpp
// En tu Blueprint de Actor:

void AMyActor::BeginPlay()
{
    Super::BeginPlay();
    
    // Inicializar WebSocket
    WebSocketComp->Connect("ws://localhost:3000/ws", "your-jwt-token");
    
    // Configurar SensorManager
    SensorManagerComp->Initialize(WebSocketComp);
    
    // Subscribirse a actualizaciones
    SensorManagerComp->OnSensorDataUpdated.AddDynamic(this, &AMyActor::OnSensorUpdate);
}

void AMyActor::OnSensorUpdate(const FSensorData& SensorData)
{
    // Actualizar visualización 3D según los datos
    UpdateVisualization(SensorData);
}
```

## Consideraciones de Rendimiento

1. Los datos se actualizan en tiempo real
2. Usar LODs para optimizar renderizado
3. Implementar culling para sensores fuera de vista
4. Considerar la frecuencia de actualización según el tipo de sensor

## Depuración

1. Habilitar logging detallado:
```cpp
UE_LOG(LogTemp, Log, TEXT("Sensor Update: %s = %f"), *SensorData.SensorId, SensorData.Value);
```

2. Usar el Widget de depuración incluido para monitorear datos en tiempo real

## Problemas Comunes

1. Error de conexión WebSocket:
   - Verificar URL y token
   - Comprobar firewall y configuración de red

2. Datos no actualizados:
   - Verificar suscripción a eventos
   - Comprobar permisos del token

3. Rendimiento:
   - Reducir frecuencia de actualización
   - Implementar LODs
   - Optimizar materiales y efectos 