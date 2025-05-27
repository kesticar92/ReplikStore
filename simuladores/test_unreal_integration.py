import asyncio
import websockets
import json
import logging
from datetime import datetime
from simulator_manager import SimulatorManager, create_default_simulators

class UnrealIntegrationTester:
    def __init__(self):
        self.manager = SimulatorManager()
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "total": 0
        }
        self.websocket = None
        
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Registra el resultado de una prueba."""
        self.test_results["total"] += 1
        if passed:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}: PASADO")
        else:
            self.test_results["failed"] += 1
            print(f"❌ {test_name}: FALLIDO")
            if message:
                print(f"   Error: {message}")
                
    async def connect_to_unreal(self):
        """Conecta con el servidor WebSocket de Unreal Engine."""
        try:
            self.websocket = await websockets.connect('ws://localhost:8080')
            welcome_message = await self.websocket.recv()
            welcome_data = json.loads(welcome_message)
            
            self.log_test(
                "Conexión WebSocket",
                welcome_data.get("type") == "welcome" and "client_id" in welcome_data,
                "No se recibió el mensaje de bienvenida correcto"
            )
            
            return True
        except Exception as e:
            self.log_test(
                "Conexión WebSocket",
                False,
                f"Error al conectar: {str(e)}"
            )
            return False
            
    async def test_sensor_data_transmission(self):
        """Prueba la transmisión de datos de sensores."""
        print("\nProbando transmisión de datos:")
        print("-" * 50)
        
        if not self.websocket:
            self.log_test(
                "Transmisión de Datos",
                False,
                "No hay conexión WebSocket activa"
            )
            return
            
        # Crear simuladores de prueba
        simulators = create_default_simulators()
        received_messages = 0
        
        # Enviar datos de cada simulador
        for simulator in simulators:
            data = simulator.generate_data()
            formatted_data = simulator.format_data(data)
            
            try:
                await self.websocket.send(formatted_data)
                response = await asyncio.wait_for(self.websocket.recv(), timeout=1.0)
                received_messages += 1
                
                self.log_test(
                    f"Transmisión - {simulator.sensor_id}",
                    True,
                    f"Datos enviados y recibidos correctamente"
                )
            except Exception as e:
                self.log_test(
                    f"Transmisión - {simulator.sensor_id}",
                    False,
                    f"Error en la transmisión: {str(e)}"
                )
                
        self.log_test(
            "Transmisión Total",
            received_messages == len(simulators),
            f"Se recibieron {received_messages} de {len(simulators)} mensajes"
        )
        
    async def test_real_time_updates(self):
        """Prueba las actualizaciones en tiempo real."""
        print("\nProbando actualizaciones en tiempo real:")
        print("-" * 50)
        
        if not self.websocket:
            self.log_test(
                "Actualizaciones en Tiempo Real",
                False,
                "No hay conexión WebSocket activa"
            )
            return
            
        # Crear un simulador de temperatura
        temp_sim = self.manager.simulators["TEMP001"]
        update_count = 0
        start_time = datetime.now()
        
        # Enviar actualizaciones durante 5 segundos
        while (datetime.now() - start_time).total_seconds() < 5:
            data = temp_sim.generate_data()
            formatted_data = temp_sim.format_data(data)
            
            try:
                await self.websocket.send(formatted_data)
                response = await asyncio.wait_for(self.websocket.recv(), timeout=0.5)
                update_count += 1
                await asyncio.sleep(0.1)
            except Exception as e:
                self.log_test(
                    "Actualizaciones en Tiempo Real",
                    False,
                    f"Error en la actualización: {str(e)}"
                )
                break
                
        self.log_test(
            "Actualizaciones en Tiempo Real",
            update_count > 0,
            f"Se realizaron {update_count} actualizaciones"
        )
        
    def print_summary(self):
        """Imprime un resumen de las pruebas."""
        print("\nResumen de Pruebas de Integración:")
        print("=" * 50)
        print(f"Total de pruebas: {self.test_results['total']}")
        print(f"Pruebas pasadas: {self.test_results['passed']}")
        print(f"Pruebas fallidas: {self.test_results['failed']}")
        print(f"Tasa de éxito: {(self.test_results['passed'] / self.test_results['total'] * 100):.2f}%")
        
async def main():
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("Iniciando pruebas de integración con Unreal Engine...")
    print("=" * 50)
    
    tester = UnrealIntegrationTester()
    
    # Ejecutar pruebas
    if await tester.connect_to_unreal():
        await tester.test_sensor_data_transmission()
        await tester.test_real_time_updates()
        
        if tester.websocket:
            await tester.websocket.close()
    
    # Imprimir resumen
    tester.print_summary()
    
if __name__ == "__main__":
    asyncio.run(main()) 