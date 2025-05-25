const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const SensorData = require('../models/SensorData');

router.get('/metrics', (req, res) => {
    res.json({});
});

// Endpoint de productos más vendidos
router.get('/top-products', async (req, res) => {
  try {
    const top = await Order.getTopProducts(5);
    // Enriquecer con detalles del producto
    const enriched = await Promise.all(top.map(async (item) => {
      const product = await Product.findById(item.productId);
      return {
        productId: item.productId,
        name: product ? product.name : 'Desconocido',
        count: item.count
      };
    }));
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error en /api/analytics/top-products:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Endpoint de sensores con mayor actividad
router.get('/top-sensors', async (req, res) => {
  try {
    SensorData.getTopSensors(5, (err, top) => {
      if (err) return res.status(500).json({ success: false, message: 'Error al obtener sensores más activos.' });
      res.json({ success: true, data: top });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

module.exports = router; 