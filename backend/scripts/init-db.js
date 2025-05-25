require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/user');
const Product = require('../models/product');
const Inventory = require('../models/inventory');

const initializeDatabase = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Conectado a MongoDB');

        // Limpiar colecciones existentes
        await Promise.all([
            User.deleteMany({}),
            Product.deleteMany({}),
            Inventory.deleteMany({})
        ]);
        logger.info('Colecciones limpiadas');

        // Crear usuario administrador
        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin'
        });
        logger.info('Usuario administrador creado');

        // Crear productos de ejemplo
        const products = await Product.create([
            {
                name: 'Producto 1',
                description: 'Descripción del producto 1',
                price: 100,
                sku: 'SKU001',
                category: 'Categoría 1'
            },
            {
                name: 'Producto 2',
                description: 'Descripción del producto 2',
                price: 200,
                sku: 'SKU002',
                category: 'Categoría 2'
            }
        ]);
        logger.info('Productos de ejemplo creados');

        // Crear registros de inventario
        await Inventory.create([
            {
                product: products[0]._id,
                quantity: 100,
                location: 'Almacén A',
                lastUpdated: new Date()
            },
            {
                product: products[1]._id,
                quantity: 50,
                location: 'Almacén B',
                lastUpdated: new Date()
            }
        ]);
        logger.info('Registros de inventario creados');

        logger.info('Base de datos inicializada exitosamente');
        process.exit(0);
    } catch (error) {
        logger.error('Error al inicializar la base de datos:', error);
        process.exit(1);
    }
};

initializeDatabase(); 