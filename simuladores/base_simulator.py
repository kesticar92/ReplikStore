import time
import random
import json
from datetime import datetime
from typing import Dict, Any, Optional
import logging

class BaseSimulator:
    def __init__(self, sensor_id: str, location: str):
        self.sensor_id = sensor_id
        self.location = location
        self.last_update = datetime.now()
        self.is_running = False
        self.logger = logging.getLogger(f"Simulator_{sensor_id}")
        
    def generate_data(self) -> Dict[str, Any]:
        """Método base para generar datos. Debe ser implementado por las clases hijas."""
        raise NotImplementedError
        
    def get_metadata(self) -> Dict[str, Any]:
        """Retorna metadatos del sensor."""
        return {
            "sensor_id": self.sensor_id,
            "location": self.location,
            "type": self.__class__.__name__,
            "last_update": self.last_update.isoformat()
        }
        
    def format_data(self, data: Dict[str, Any]) -> str:
        """Formatea los datos para transmisión."""
        return json.dumps({
            "metadata": self.get_metadata(),
            "data": data,
            "timestamp": datetime.now().isoformat()
        })
        
    def start(self):
        """Inicia la simulación."""
        self.is_running = True
        self.logger.info(f"Simulador {self.sensor_id} iniciado")
        
    def stop(self):
        """Detiene la simulación."""
        self.is_running = False
        self.logger.info(f"Simulador {self.sensor_id} detenido")
        
    def add_noise(self, value: float, noise_level: float) -> float:
        """Añade ruido aleatorio a un valor."""
        return value + random.uniform(-noise_level, noise_level) 