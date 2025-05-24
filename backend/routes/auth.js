const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Validaciones para registro
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Rutas de autenticación
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Endpoint para verificar token
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token no proporcionado'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        res.json({
            success: true,
            user: {
                userId: decoded.userId,
                role: decoded.role
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});

// Endpoint temporal para pruebas
router.post('/test-token', (req, res) => {
    const token = jwt.sign(
        { userId: 'test', role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
    );
    res.json({ token });
});

module.exports = router; 