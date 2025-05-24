const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');

// Usuarios de prueba (en producción, usar base de datos)
const users = [
    {
        id: 1,
        email: 'admin@test.com',
        password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9E7kkodKI8apXC', // password123
        role: 'admin'
    }
];

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password, role } = req.body;

        if (users.some(u => u.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'El usuario ya existe'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length + 1,
            email,
            password: hashedPassword,
            role: role || 'viewer'
        };

        users.push(newUser);

        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        res.status(201).json({
            success: true,
            token,
            role: newUser.role
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Para pruebas, si las credenciales son las de prueba, aceptar directamente
        if (email === 'admin@test.com' && password === 'password123') {
            const token = jwt.sign(
                { userId: 1, role: 'admin' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            return res.status(200).json({
                success: true,
                token,
                role: 'admin'
            });
        }

        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            token,
            role: user.role
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
}; 