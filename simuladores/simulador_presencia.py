from base_simulator import BaseSimulator
import random
from typing import Dict, Any
from datetime import datetime, timedelta

class PresenceSimulator(BaseSimulator):
    def __init__(self, sensor_id: str, location: str,
                 detection_radius: float = 5.0,
                 false_positive_rate: float = 0.01):
        super().__init__(sensor_id, location)
        self.detection_radius = detection_radius
        self.false_positive_rate = false_positive_rate
        self.last_detection = None
        self.presence_duration = timedelta(minutes=random.randint(1, 10))
        
    def generate_data(self) -> Dict[str, Any]:
        """Genera datos de presencia simulados."""
        current_time = datetime.now()
        
        # Simular falsos positivos
        if random.random() < self.false_positive_rate:
            return {
                "presence": True,
                "confidence": random.uniform(0.6, 0.8),
                "type": "false_positive"
            }
            
        # Simular presencia real
        if self.last_detection is None or current_time - self.last_detection > self.presence_duration:
            if random.random() < 0.3:  # 30% de probabilidad de nueva detección
                self.last_detection = current_time
                self.presence_duration = timedelta(minutes=random.randint(1, 10))
                return {
                    "presence": True,
                    "confidence": random.uniform(0.8, 1.0),
                    "type": "real"
                }
                
        # Verificar si la presencia actual ha expirado
        if self.last_detection and current_time - self.last_detection > self.presence_duration:
            self.last_detection = None
            
        return {
            "presence": self.last_detection is not None,
            "confidence": 1.0 if self.last_detection is None else 0.9,
            "type": "none" if self.last_detection is None else "real"
        }
        
    def get_metadata(self) -> Dict[str, Any]:
        """Obtiene metadatos específicos del sensor de presencia."""
        metadata = super().get_metadata()
        metadata.update({
            "detection_radius": self.detection_radius,
            "false_positive_rate": self.false_positive_rate,
            "last_detection": self.last_detection.isoformat() if self.last_detection else None
        })
        return metadata 