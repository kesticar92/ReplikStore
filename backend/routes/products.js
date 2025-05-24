const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');

const router = express.Router();

// Validaciones para productos
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre del producto es requerido'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La categoría no puede estar vacía'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('La URL de la imagen debe ser válida')
];

// Rutas de productos
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productValidation, productController.createProduct);
router.put('/:id', productValidation, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router; 