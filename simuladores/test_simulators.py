import time
from simulador_temperatura import TemperatureSimulator
from simulador_presencia import PresenceSimulator
from simulador_movimiento import MovementSimulator
from simulador_humedad import HumiditySimulator
from simulador_stock import StockSimulator

def test_simulator(simulator, iterations: int = 5, delay: float = 1.0):
    """Prueba un simulador específico."""
    print(f"\nProbando {simulator.__class__.__name__}:")
    print("-" * 50)
    
    simulator.start()
    
    for i in range(iterations):
        data = simulator.generate_data()
        print(f"\nIteración {i + 1}:")
        print(f"Datos: {data}")
        print(f"Metadatos: {simulator.get_metadata()}")
        time.sleep(delay)
        
    simulator.stop()
    print("-" * 50)

def main():
    # Crear instancias de los simuladores
    temp_sim = TemperatureSimulator("TEMP001", "Sección A")
    presence_sim = PresenceSimulator("PRES001", "Entrada")
    movement_sim = MovementSimulator("MOVE001", "Pasillo Principal")
    humidity_sim = HumiditySimulator("HUM001", "Sección B")
    stock_sim = StockSimulator("STOCK001", "Almacén", "PROD001")
    
    # Probar cada simulador
    simulators = [
        temp_sim,
        presence_sim,
        movement_sim,
        humidity_sim,
        stock_sim
    ]
    
    for simulator in simulators:
        test_simulator(simulator)
        
if __name__ == "__main__":
    main() 