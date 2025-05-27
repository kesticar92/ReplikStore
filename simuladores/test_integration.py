import asyncio
import json
import websockets
import logging
from simulator_manager import SimulatorManager, create_default_simulators

async def test_websocket_server():
    """Prueba la conexión con el servidor WebSocket."""
    try:
        async with websockets.connect("ws://localhost:8080") as websocket:
            print("✅ Conexión WebSocket establecida")
            
            # Enviar mensaje de prueba
            test_message = {
                "type": "test",
                "data": "Test message"
            }
            await websocket.send(json.dumps(test_message))
            
            # Esperar respuesta
            response = await websocket.recv()
            print(f"✅ Respuesta recibida: {response}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False
        
    return True

async def test_simulator_data():
    """Prueba la generación y envío de datos de los simuladores."""
    manager = SimulatorManager()
    
    # Añadir simuladores de prueba
    for simulator in create_default_simulators():
        manager.add_simulator(simulator)
        
    try:
        # Iniciar el gestor
        manager.start()
        
        # Probar envío de datos
        async with websockets.connect("ws://localhost:8080") as websocket:
            print("\nProbando envío de datos de simuladores:")
            print("-" * 50)
            
            for _ in range(3):  # Probar 3 iteraciones
                for simulator in manager.simulators.values():
                    data = simulator.generate_data()
                    formatted_data = simulator.format_data(data)
                    print(f"\nDatos de {simulator.sensor_id}:")
                    print(json.dumps(json.loads(formatted_data), indent=2))
                    await websocket.send(formatted_data)
                await asyncio.sleep(1)
                
        print("\n✅ Prueba de datos completada")
        
    except Exception as e:
        print(f"❌ Error en prueba de datos: {e}")
        return False
    finally:
        manager.stop()
        
    return True

async def main():
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("Iniciando pruebas de integración...")
    print("=" * 50)
    
    # Probar conexión WebSocket
    print("\n1. Probando conexión WebSocket...")
    if await test_websocket_server():
        print("✅ Prueba de conexión completada")
    else:
        print("❌ Prueba de conexión fallida")
        return
        
    # Probar datos de simuladores
    print("\n2. Probando datos de simuladores...")
    if await test_simulator_data():
        print("✅ Prueba de datos completada")
    else:
        print("❌ Prueba de datos fallida")
        return
        
    print("\n✅ Todas las pruebas completadas exitosamente")
    
if __name__ == "__main__":
    asyncio.run(main()) 