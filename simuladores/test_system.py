import asyncio
import json
import websockets
import logging
import time
from datetime import datetime
from simulator_manager import SimulatorManager, create_default_simulators
from simulador_temperatura import TemperatureSimulator
from simulador_presencia import PresenceSimulator
from simulador_movimiento import MovementSimulator
from simulador_humedad import HumiditySimulator
from simulador_stock import StockSimulator

class SystemTester:
    def __init__(self):
        self.manager = SimulatorManager()
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "total": 0
        }
        
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
                
    async def test_individual_simulators(self):
        """Prueba cada simulador individualmente."""
        print("\nProbando simuladores individuales:")
        print("-" * 50)
        
        # Probar simulador de temperatura
        temp_sim = TemperatureSimulator("TEMP_TEST", "Test Area")
        temp_data = temp_sim.generate_data()
        self.log_test(
            "Simulador de Temperatura",
            all(k in temp_data for k in ["temperature", "unit", "status"]),
            "Faltan campos requeridos en los datos de temperatura"
        )
        
        # Probar simulador de presencia
        pres_sim = PresenceSimulator("PRES_TEST", "Test Area")
        pres_data = pres_sim.generate_data()
        self.log_test(
            "Simulador de Presencia",
            all(k in pres_data for k in ["presence", "confidence", "type"]),
            "Faltan campos requeridos en los datos de presencia"
        )
        
        # Probar simulador de movimiento
        move_sim = MovementSimulator("MOVE_TEST", "Test Area")
        move_data = move_sim.generate_data()
        self.log_test(
            "Simulador de Movimiento",
            all(k in move_data for k in ["position", "velocity", "intensity"]),
            "Faltan campos requeridos en los datos de movimiento"
        )
        
        # Probar simulador de humedad
        hum_sim = HumiditySimulator("HUM_TEST", "Test Area")
        hum_data = hum_sim.generate_data()
        self.log_test(
            "Simulador de Humedad",
            all(k in hum_data for k in ["humidity", "unit", "status"]),
            "Faltan campos requeridos en los datos de humedad"
        )
        
        # Probar simulador de stock
        stock_sim = StockSimulator("STOCK_TEST", "Test Area", "TEST_PROD")
        stock_data = stock_sim.generate_data()
        self.log_test(
            "Simulador de Stock",
            all(k in stock_data for k in ["product_id", "current_stock", "stock_level"]),
            "Faltan campos requeridos en los datos de stock"
        )
        
    async def test_data_generation(self):
        """Prueba la generación de datos durante un período."""
        print("\nProbando generación de datos:")
        print("-" * 50)
        
        # Crear simuladores de prueba
        simulators = create_default_simulators()
        
        # Probar generación de datos durante 5 segundos
        start_time = time.time()
        data_points = 0
        
        while time.time() - start_time < 5:
            for simulator in simulators:
                data = simulator.generate_data()
                if data:
                    data_points += 1
            await asyncio.sleep(0.1)
            
        self.log_test(
            "Generación de Datos",
            data_points > 0,
            f"Se generaron {data_points} puntos de datos"
        )
        
    async def test_manager_operations(self):
        """Prueba las operaciones del gestor de simuladores."""
        print("\nProbando operaciones del gestor:")
        print("-" * 50)
        
        # Probar añadir simuladores
        initial_count = len(self.manager.simulators)
        for simulator in create_default_simulators():
            self.manager.add_simulator(simulator)
            
        self.log_test(
            "Añadir Simuladores",
            len(self.manager.simulators) == initial_count + 10,
            f"Se añadieron {len(self.manager.simulators) - initial_count} simuladores"
        )
        
        # Probar eliminar simuladores
        test_id = "TEMP001"
        self.manager.remove_simulator(test_id)
        self.log_test(
            "Eliminar Simuladores",
            test_id not in self.manager.simulators,
            f"El simulador {test_id} no se eliminó correctamente"
        )
        
    async def test_data_formatting(self):
        """Prueba el formato de los datos generados."""
        print("\nProbando formato de datos:")
        print("-" * 50)
        
        for simulator in self.manager.simulators.values():
            data = simulator.generate_data()
            formatted_data = simulator.format_data(data)
            
            try:
                parsed_data = json.loads(formatted_data)
                self.log_test(
                    f"Formato de datos - {simulator.sensor_id}",
                    all(k in parsed_data for k in ["metadata", "data", "timestamp"]),
                    "Faltan campos requeridos en el formato de datos"
                )
            except json.JSONDecodeError:
                self.log_test(
                    f"Formato de datos - {simulator.sensor_id}",
                    False,
                    "Error al decodificar JSON"
                )
                
    def print_summary(self):
        """Imprime un resumen de las pruebas."""
        print("\nResumen de Pruebas:")
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
    
    print("Iniciando pruebas del sistema...")
    print("=" * 50)
    
    tester = SystemTester()
    
    # Ejecutar pruebas
    await tester.test_individual_simulators()
    await tester.test_data_generation()
    await tester.test_manager_operations()
    await tester.test_data_formatting()
    
    # Imprimir resumen
    tester.print_summary()
    
if __name__ == "__main__":
    asyncio.run(main()) 