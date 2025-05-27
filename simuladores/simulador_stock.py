from base_simulator import BaseSimulator
import random
from typing import Dict, Any, List
from datetime import datetime, timedelta

class StockSimulator(BaseSimulator):
    def __init__(self, sensor_id: str, location: str,
                 product_id: str,
                 max_stock: int = 100,
                 min_stock: int = 10,
                 current_stock: int = 50,
                 restock_threshold: int = 20):
        super().__init__(sensor_id, location)
        self.product_id = product_id
        self.max_stock = max_stock
        self.min_stock = min_stock
        self.current_stock = current_stock
        self.restock_threshold = restock_threshold
        self.last_restock = datetime.now()
        self.restock_duration = timedelta(hours=2)
        self.is_restocking = False
        
    def _simulate_sales(self) -> int:
        """Simula ventas aleatorias."""
        # Probabilidad de venta basada en la hora del día
        hour = datetime.now().hour
        if 10 <= hour <= 14 or 17 <= hour <= 20:  # Horas pico
            sale_probability = 0.3
        else:
            sale_probability = 0.1
            
        if random.random() < sale_probability:
            return random.randint(1, 3)
        return 0
        
    def _check_restock(self) -> bool:
        """Verifica si es necesario reabastecer."""
        if self.current_stock <= self.restock_threshold and not self.is_restocking:
            self.is_restocking = True
            self.last_restock = datetime.now()
            return True
        return False
        
    def _process_restock(self) -> int:
        """Procesa el reabastecimiento."""
        if self.is_restocking:
            if datetime.now() - self.last_restock >= self.restock_duration:
                restock_amount = self.max_stock - self.current_stock
                self.current_stock = self.max_stock
                self.is_restocking = False
                return restock_amount
        return 0
        
    def generate_data(self) -> Dict[str, Any]:
        """Genera datos de stock simulados."""
        # Simular ventas
        sales = self._simulate_sales()
        self.current_stock = max(0, self.current_stock - sales)
        
        # Verificar reabastecimiento
        needs_restock = self._check_restock()
        
        # Procesar reabastecimiento
        restock_amount = self._process_restock()
        
        # Calcular nivel de stock
        stock_level = (self.current_stock / self.max_stock) * 100
        
        return {
            "product_id": self.product_id,
            "current_stock": self.current_stock,
            "stock_level": round(stock_level, 2),
            "status": "restocking" if self.is_restocking else "normal",
            "sales": sales,
            "restock_amount": restock_amount,
            "needs_restock": needs_restock
        }
        
    def get_metadata(self) -> Dict[str, Any]:
        """Obtiene metadatos específicos del sensor de stock."""
        metadata = super().get_metadata()
        metadata.update({
            "product_id": self.product_id,
            "max_stock": self.max_stock,
            "min_stock": self.min_stock,
            "restock_threshold": self.restock_threshold,
            "last_restock": self.last_restock.isoformat(),
            "is_restocking": self.is_restocking
        })
        return metadata
