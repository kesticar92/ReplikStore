const express = require('express');
const router = express.Router();
const jsonwebtoken = require('jsonwebtoken');

// Endpoint de prueba para obtener un token
router.post('/test-token', (req, res) => {
    const token = jsonwebtoken.sign(
        { 
            userId: 'test',
            role: 'admin'
        },
        process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro',
        { expiresIn: '1h' }
    );

    res.json({
        success: true,
        token
    });
});

module.exports = router; 