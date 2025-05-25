const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');

// Validar que los productos existan y cantidades sean positivas
async function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: 'La orden debe tener al menos un producto.' };
  }
  for (const item of items) {
    if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
      return { valid: false, message: 'Cada item debe tener productId y cantidad positiva.' };
    }
    const product = await Product.findById(item.productId);
    if (!product) {
      return { valid: false, message: `Producto con id ${item.productId} no existe.` };
    }
  }
  return { valid: true };
}

// GET /api/orders
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Lista de órdenes',
        data: []
    });
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { items, total } = req.body;
    const date = new Date().toISOString();
    // Validar items
    const validation = await validateOrderItems(items);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }
    // Crear orden
    Order.create({ date, items, total }, (err, order) => {
      if (err) return res.status(500).json({ success: false, message: 'Error al crear la orden.' });
      res.status(201).json({ success: true, data: order });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
    res.json({
        success: true,
        message: `Detalles de la orden ${req.params.id}`,
        data: {}
    });
});

module.exports = router; 