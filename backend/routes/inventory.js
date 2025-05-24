const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json([]);
});

router.post('/update', (req, res) => {
    res.json({ message: 'Inventario actualizado' });
});

module.exports = router; 