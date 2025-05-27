from base_simulator import BaseSimulator
import random
import math
from typing import Dict, Any, Tuple

class MovementSimulator(BaseSimulator):
    def __init__(self, sensor_id: str, location: str,
                 max_speed: float = 2.0,  # metros por segundo
                 noise_level: float = 0.1):
        super().__init__(sensor_id, location)
        self.max_speed = max_speed
        self.noise_level = noise_level
        self.current_position = (0.0, 0.0, 0.0)
        self.current_velocity = (0.0, 0.0, 0.0)
        
    def _update_position(self) -> Tuple[float, float, float]:
        """Actualiza la posición basada en la velocidad actual."""
        x, y, z = self.current_position
        vx, vy, vz = self.current_velocity
        
        # Añadir ruido a la velocidad
        vx = self.add_noise(vx, self.noise_level)
        vy = self.add_noise(vy, self.noise_level)
        vz = self.add_noise(vz, self.noise_level)
        
        # Actualizar posición
        x += vx
        y += vy
        z += vz
        
        # Mantener dentro de límites razonables
        x = max(-10, min(10, x))
        y = max(-10, min(10, y))
        z = max(0, min(3, z))
        
        self.current_position = (x, y, z)
        self.current_velocity = (vx, vy, vz)
        
        return self.current_position
        
    def _generate_new_velocity(self) -> Tuple[float, float, float]:
        """Genera una nueva velocidad aleatoria."""
        speed = random.uniform(0, self.max_speed)
        angle = random.uniform(0, 2 * math.pi)
        
        vx = speed * math.cos(angle)
        vy = speed * math.sin(angle)
        vz = random.uniform(-0.5, 0.5)
        
        return (vx, vy, vz)
        
    def generate_data(self) -> Dict[str, Any]:
        """Genera datos de movimiento simulados."""
        # 20% de probabilidad de cambiar la velocidad
        if random.random() < 0.2:
            self.current_velocity = self._generate_new_velocity()
            
        # Actualizar posición
        x, y, z = self._update_position()
        
        # Calcular intensidad del movimiento
        speed = math.sqrt(sum(v * v for v in self.current_velocity))
        intensity = min(100, (speed / self.max_speed) * 100)
        
        return {
            "position": {
                "x": round(x, 2),
                "y": round(y, 2),
                "z": round(z, 2)
            },
            "velocity": {
                "x": round(self.current_velocity[0], 2),
                "y": round(self.current_velocity[1], 2),
                "z": round(self.current_velocity[2], 2)
            },
            "intensity": round(intensity, 2),
            "speed": round(speed, 2)
        }
        
    def get_metadata(self) -> Dict[str, Any]:
        """Obtiene metadatos específicos del sensor de movimiento."""
        metadata = super().get_metadata()
        metadata.update({
            "max_speed": self.max_speed,
            "noise_level": self.noise_level,
            "current_position": self.current_position,
            "current_velocity": self.current_velocity
        })
        return metadata 