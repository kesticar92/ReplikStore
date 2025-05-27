from base_simulator import BaseSimulator
import random
from typing import Dict, Any

class TemperatureSimulator(BaseSimulator):
    def __init__(self, sensor_id: str, location: str, 
                 base_temp: float = 22.0,
                 min_temp: float = 18.0,
                 max_temp: float = 26.0,
                 noise_level: float = 0.5):
        super().__init__(sensor_id, location)
        self.base_temp = base_temp
        self.min_temp = min_temp
        self.max_temp = max_temp
        self.noise_level = noise_level
        self.current_temp = base_temp
        
    def generate_data(self) -> Dict[str, Any]:
        """Genera datos de temperatura simulados."""
        # Simular variación natural de temperatura
        variation = random.uniform(-0.2, 0.2)
        self.current_temp += variation
        
        # Mantener dentro de los límites
        self.current_temp = max(self.min_temp, min(self.max_temp, self.current_temp))
        
        # Añadir ruido
        temp_with_noise = self.add_noise(self.current_temp, self.noise_level)
        
        return {
            "temperature": round(temp_with_noise, 2),
            "unit": "celsius",
            "status": "normal" if self.min_temp <= temp_with_noise <= self.max_temp else "warning"
        }
        
    def get_metadata(self) -> Dict[str, Any]:
        """Obtiene metadatos específicos del sensor de temperatura."""
        metadata = super().get_metadata()
        metadata.update({
            "base_temperature": self.base_temp,
            "min_temperature": self.min_temp,
            "max_temperature": self.max_temp,
            "noise_level": self.noise_level
        })
        return metadata
