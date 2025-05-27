from base_simulator import BaseSimulator
import random
from typing import Dict, Any

class HumiditySimulator(BaseSimulator):
    def __init__(self, sensor_id: str, location: str,
                 base_humidity: float = 50.0,
                 min_humidity: float = 40.0,
                 max_humidity: float = 60.0,
                 noise_level: float = 2.0):
        super().__init__(sensor_id, location)
        self.base_humidity = base_humidity
        self.min_humidity = min_humidity
        self.max_humidity = max_humidity
        self.noise_level = noise_level
        self.current_humidity = base_humidity
        
    def generate_data(self) -> Dict[str, Any]:
        """Genera datos de humedad simulados."""
        # Simular variación natural de humedad
        variation = random.uniform(-1.0, 1.0)
        self.current_humidity += variation
        
        # Mantener dentro de los límites
        self.current_humidity = max(self.min_humidity, min(self.max_humidity, self.current_humidity))
        
        # Añadir ruido
        humidity_with_noise = self.add_noise(self.current_humidity, self.noise_level)
        
        # Determinar estado
        if humidity_with_noise < self.min_humidity:
            status = "low"
        elif humidity_with_noise > self.max_humidity:
            status = "high"
        else:
            status = "normal"
            
        return {
            "humidity": round(humidity_with_noise, 2),
            "unit": "percentage",
            "status": status,
            "trend": "increasing" if variation > 0 else "decreasing"
        }
        
    def get_metadata(self) -> Dict[str, Any]:
        """Obtiene metadatos específicos del sensor de humedad."""
        metadata = super().get_metadata()
        metadata.update({
            "base_humidity": self.base_humidity,
            "min_humidity": self.min_humidity,
            "max_humidity": self.max_humidity,
            "noise_level": self.noise_level
        })
        return metadata 