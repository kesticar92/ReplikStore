const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Productos]
 *     summary: Listar productos
 *     description: Obtiene una lista paginada de productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de productos por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o SKU
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/',
    authMiddleware.verifyToken,
    cache.cache(300), // Cachear por 5 minutos
    productController.list
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Productos]
 *     summary: Obtener producto
 *     description: Obtiene los detalles de un producto específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id',
    authMiddleware.verifyToken,
    cache.cache(300), // Cachear por 5 minutos
    productController.get
);

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Productos]
 *     summary: Crear producto
 *     description: Crea un nuevo producto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - price
 *               - stock
 *               - minStock
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Producto Ejemplo"
 *               description:
 *                 type: string
 *                 example: "Descripción del producto"
 *               sku:
 *                 type: string
 *                 example: "SKU123"
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 99.99
 *               stock:
 *                 type: integer
 *                 example: 100
 *               minStock:
 *                 type: integer
 *                 example: 10
 *               category:
 *                 type: string
 *                 example: "Electrónicos"
 *               location:
 *                 type: object
 *                 properties:
 *                   x:
 *                     type: number
 *                     example: 1.5
 *                   y:
 *                     type: number
 *                     example: 2.3
 *                   z:
 *                     type: number
 *                     example: 0.0
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    validation.validateRequest({
        body: {
            name: { type: 'string', required: true, minLength: 2 },
            description: { type: 'string', required: false },
            sku: { type: 'string', required: true, minLength: 3 },
            price: { type: 'number', required: true, min: 0 },
            stock: { type: 'integer', required: true, min: 0 },
            minStock: { type: 'integer', required: true, min: 0 },
            category: { type: 'string', required: true },
            location: {
                type: 'object',
                required: false,
                properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                    z: { type: 'number' }
                }
            }
        }
    }),
    cache.invalidate('products:*'),
    productController.create
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Productos]
 *     summary: Actualizar producto
 *     description: Actualiza un producto existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Producto Actualizado"
 *               description:
 *                 type: string
 *                 example: "Nueva descripción"
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 149.99
 *               stock:
 *                 type: integer
 *                 example: 150
 *               minStock:
 *                 type: integer
 *                 example: 15
 *               category:
 *                 type: string
 *                 example: "Nueva Categoría"
 *               location:
 *                 type: object
 *                 properties:
 *                   x:
 *                     type: number
 *                     example: 2.0
 *                   y:
 *                     type: number
 *                     example: 3.0
 *                   z:
 *                     type: number
 *                     example: 1.0
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    validation.validateRequest({
        body: {
            name: { type: 'string', required: false, minLength: 2 },
            description: { type: 'string', required: false },
            price: { type: 'number', required: false, min: 0 },
            stock: { type: 'integer', required: false, min: 0 },
            minStock: { type: 'integer', required: false, min: 0 },
            category: { type: 'string', required: false },
            location: {
                type: 'object',
                required: false,
                properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                    z: { type: 'number' }
                }
            }
        }
    }),
    cache.invalidate('products:*'),
    productController.update
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Productos]
 *     summary: Eliminar producto
 *     description: Elimina un producto existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Producto eliminado exitosamente"
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id',
    authMiddleware.verifyToken,
    authMiddleware.requireRole('admin'),
    cache.invalidate('products:*'),
    productController.delete
);

module.exports = router; 