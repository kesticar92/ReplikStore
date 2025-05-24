import os
import json

# Carpeta de salida para los recursos generados
OUTPUT_DIR = 'unreal/blueprints'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Estructura base para el Blueprint (pseudo-formato, para guía visual)
blueprint_structure = {
    "BlueprintName": "BP_WebSocketManager",
    "Description": "Actor que gestiona la conexión WebSocket y emite eventos para seguridad, inventario, clientes y layout.",
    "Nodes": [
        {"Type": "EventBeginPlay", "Description": "Conectar al WebSocket al iniciar el juego."},
        {"Type": "WebSocketConnect", "URL": "ws://localhost:3001", "Description": "Conexión al backend."},
        {"Type": "WebSocketOnMessage", "Description": "Procesar mensajes entrantes y emitir eventos UE5."},
        {"Type": "SwitchOnString", "Variable": "message.type", "Cases": [
            "security_event", "inventory_event", "customer_event", "layout_event", "layout_warning", "status_update"
        ]},
        {"Type": "CustomEvent", "Name": "OnSecurityEvent", "Description": "Evento para widgets de seguridad."},
        {"Type": "CustomEvent", "Name": "OnInventoryEvent", "Description": "Evento para widgets de inventario."},
        {"Type": "CustomEvent", "Name": "OnCustomerEvent", "Description": "Evento para widgets de clientes."},
        {"Type": "CustomEvent", "Name": "OnLayoutEvent", "Description": "Evento para widgets de layout."},
        {"Type": "CustomEvent", "Name": "OnLayoutWarning", "Description": "Evento para advertencias de layout."},
        {"Type": "CustomEvent", "Name": "OnStatusUpdate", "Description": "Evento para actualización general de estado."}
    ],
    "Variables": [
        {"Name": "WebSocket", "Type": "Object", "Class": "WebSocket"},
        {"Name": "LastMessage", "Type": "String"}
    ]
}

# Guardar estructura como guía visual
with open(os.path.join(OUTPUT_DIR, 'BP_WebSocketManager_structure.json'), 'w') as f:
    json.dump(blueprint_structure, f, indent=4, ensure_ascii=False)

# Instrucciones para importar y conectar en UE5
instructions = '''
# Instrucciones para integrar WebSocket en Unreal Engine 5

1. Instala un plugin de WebSocket para UE5 (recomendado: getnamo/websocket-ue4 o similar).
2. Crea un Blueprint Actor llamado BP_WebSocketManager.
3. Usa la estructura del archivo BP_WebSocketManager_structure.json como guía para los nodos:
   - Conecta al WebSocket en BeginPlay.
   - Usa el nodo OnMessage para procesar los mensajes entrantes.
   - Haz un Switch sobre message.type y dispara eventos personalizados para cada tipo.
4. Crea widgets que se suscriban a estos eventos para mostrar cámaras, inventario, clientes y layout.
5. Puedes extender la lógica para enviar comandos al backend usando el nodo SendMessage.

Incluye los Custom Events:
- OnSecurityEvent
- OnInventoryEvent
- OnCustomerEvent
- OnLayoutEvent
- OnLayoutWarning
- OnStatusUpdate

Esto permitirá que toda la UI reaccione en tiempo real a los eventos del backend.

## Solución definitiva: Regenerar archivos de proyecto Xcode

### 1. Cierra Unreal Engine y Xcode completamente.

### 2. Regenera los archivos de proyecto Xcode

Abre la terminal y ejecuta este comando desde la raíz de tu proyecto (donde está `MyProject2.uproject`):

```sh
/Applications/Unreal\ Engine/Engine/Build/BatchFiles/Mac/GenerateProjectFiles.sh -project="$PWD/MyProject2.uproject"
```

- Si tienes Unreal Engine instalado en otra ruta, ajusta la ruta del script.
- Este comando regenerará los archivos `.xcodeproj` y `.xcworkspace` correctamente.

### 3. Abre el nuevo archivo de proyecto en Xcode

- Abre el archivo `MyProject2.xcworkspace` (o `MyProject2.xcodeproj` si no tienes workspace).
- Ahora los targets deberían aparecer en negro (no en rojo).

### 4. Haz Build en Xcode

- Selecciona el target **MyProject2Editor (Mac)**.
- Haz clic en "Build" (Cmd+B).

### 5. Abre Unreal Engine

- Una vez que el build termine sin errores, abre tu proyecto en Unreal Engine.
- Ya no debería pedirte recompilar módulos y deberías ver todas las clases C++.

## ¿Por qué ocurre esto?

- Cuando se eliminan carpetas como `Intermediate` y `Binaries`, Unreal Engine pierde los archivos de proyecto de Xcode.
- Regenerar los archivos de proyecto soluciona el problema y vuelve a vincular todo correctamente.

## ¿Qué hacer si el comando falla o no tienes el script?

- Dímelo y te ayudo a encontrar la ruta correcta del script en tu instalación de Unreal Engine.
- Si el build en Xcode muestra errores, mándame el mensaje exacto y lo corrijo automáticamente.

**¿Quieres que ejecute el comando por ti o prefieres probarlo tú?**  
¡Avísame si necesitas ayuda con la ruta del script o si surge algún error nuevo!
'''

with open(os.path.join(OUTPUT_DIR, 'BP_WebSocketManager_instructions.txt'), 'w') as f:
    f.write(instructions)

print(f"Archivos generados en {OUTPUT_DIR}:")
print("- BP_WebSocketManager_structure.json")
print("- BP_WebSocketManager_instructions.txt") 