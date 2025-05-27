import asyncio
import json
import websockets
import logging
from typing import Dict, List, Any
from datetime import datetime
from base_simulator import BaseSimulator
from simulador_temperatura import TemperatureSimulator
from simulador_presencia import PresenceSimulator
from simulador_movimiento import MovementSimulator
from simulador_humedad import HumiditySimulator
from simulador_stock import StockSimulator

class SimulatorManager:
    def __init__(self, websocket_url: str = "ws://localhost:8080"):
        self.websocket_url = websocket_url
        self.simulators: Dict[str, BaseSimulator] = {}
        self.is_running = False
        self.logger = logging.getLogger("SimulatorManager")
        
    def add_simulator(self, simulator: BaseSimulator):
        """Añade un simulador al gestor."""
        self.simulators[simulator.sensor_id] = simulator
        self.logger.info(f"Simulador {simulator.sensor_id} añadido")
        
    def remove_simulator(self, sensor_id: str):
        """Elimina un simulador del gestor."""
        if sensor_id in self.simulators:
            self.simulators[sensor_id].stop()
            del self.simulators[sensor_id]
            self.logger.info(f"Simulador {sensor_id} eliminado")
            
    async def send_data(self, websocket, data: Dict[str, Any]):
        """Envía datos a través del WebSocket."""
        try:
            await websocket.send(json.dumps(data))
        except Exception as e:
            self.logger.error(f"Error al enviar datos: {e}")
            
    async def handle_connection(self):
        """Maneja la conexión WebSocket con Unreal Engine."""
        while self.is_running:
            try:
                async with websockets.connect(self.websocket_url) as websocket:
                    self.logger.info("Conectado a Unreal Engine")
                    
                    while self.is_running:
                        # Generar y enviar datos de todos los simuladores
                        for simulator in self.simulators.values():
                            data = simulator.generate_data()
                            formatted_data = simulator.format_data(data)
                            await self.send_data(websocket, json.loads(formatted_data))
                            
                        await asyncio.sleep(1)  # Intervalo de actualización
                        
            except Exception as e:
                self.logger.error(f"Error de conexión: {e}")
                await asyncio.sleep(5)  # Esperar antes de reconectar
                
    def start(self):
        """Inicia el gestor de simuladores."""
        self.is_running = True
        for simulator in self.simulators.values():
            simulator.start()
        self.logger.info("Gestor de simuladores iniciado")
        
    def stop(self):
        """Detiene el gestor de simuladores."""
        self.is_running = False
        for simulator in self.simulators.values():
            simulator.stop()
        self.logger.info("Gestor de simuladores detenido")
        
    async def run(self):
        """Ejecuta el gestor de simuladores."""
        self.start()
        await self.handle_connection()
        
def create_default_simulators() -> List[BaseSimulator]:
    """Crea una configuración predeterminada de simuladores."""
    return [
        TemperatureSimulator("TEMP001", "Sección A"),
        TemperatureSimulator("TEMP002", "Sección B"),
        PresenceSimulator("PRES001", "Entrada"),
        PresenceSimulator("PRES002", "Salida"),
        MovementSimulator("MOVE001", "Pasillo Principal"),
        MovementSimulator("MOVE002", "Pasillo Secundario"),
        HumiditySimulator("HUM001", "Sección A"),
        HumiditySimulator("HUM002", "Sección B"),
        StockSimulator("STOCK001", "Almacén A", "PROD001"),
        StockSimulator("STOCK002", "Almacén B", "PROD002")
    ]

async def main():
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Crear y configurar el gestor
    manager = SimulatorManager()
    
    # Añadir simuladores predeterminados
    for simulator in create_default_simulators():
        manager.add_simulator(simulator)
        
    try:
        await manager.run()
    except KeyboardInterrupt:
        manager.stop()
        print("\nSimulación detenida por el usuario")
        
if __name__ == "__main__":
    asyncio.run(main()) 