const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { validateProduct, validateStockUpdate } = require('../middleware/validator');
const { checkRole } = require('../middleware/security');
const { cacheMiddleware } = require('../utils/cache');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');
const cache = require('../middleware/cache');

/**
 * @swagger
 * /inventory:
 *   get:
 *     tags: [Inventario]
 *     summary: Listar movimientos de inventario
 *     description: Obtiene una lista paginada de movimientos de inventario
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
 *         description: Cantidad de movimientos por página
 *       - in: query
 *         name: product
 *         schema:
 *           type: string
 *         description: Filtrar por ID de producto
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filtrar por ubicación
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [in, out, adjustment, return]
 *         description: Filtrar por tipo de movimiento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de movimientos obtenida exitosamente
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
 *                     movements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryMovement'
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
    inventoryController.list
);

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     tags: [Inventario]
 *     summary: Obtener movimiento
 *     description: Obtiene los detalles de un movimiento específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del movimiento
 *     responses:
 *       200:
 *         description: Movimiento obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InventoryMovement'
 *       404:
 *         description: Movimiento no encontrado
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
    inventoryController.get
);

/**
 * @swagger
 * /inventory:
 *   post:
 *     tags: [Inventario]
 *     summary: Crear movimiento
 *     description: Crea un nuevo movimiento de inventario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - quantity
 *               - type
 *               - location
 *             properties:
 *               product:
 *                 type: string
 *                 format: uuid
 *                 example: "60d21b4667d0d8992e610c85"
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *                 example: 10
 *               type:
 *                 type: string
 *                 enum: [in, out, adjustment, return]
 *                 example: "in"
 *               location:
 *                 type: string
 *                 example: "ZONA-A"
 *               notes:
 *                 type: string
 *                 example: "Movimiento de entrada por compra"
 *     responses:
 *       201:
 *         description: Movimiento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InventoryMovement'
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
            product: { type: 'string', required: true },
            quantity: { type: 'number', required: true, min: 0 },
            type: { type: 'string', required: true, enum: ['in', 'out', 'adjustment', 'return'] },
            location: { type: 'string', required: true },
            notes: { type: 'string', required: false }
        }
    }),
    cache.invalidate('inventory:*'),
    inventoryController.create
);

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     tags: [Inventario]
 *     summary: Actualizar movimiento
 *     description: Actualiza un movimiento existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del movimiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Notas actualizadas"
 *               status:
 *                 type: string
 *                 enum: [completed, cancelled]
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Movimiento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InventoryMovement'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Movimiento no encontrado
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
            notes: { type: 'string', required: false },
            status: { type: 'string', required: false, enum: ['completed', 'cancelled'] }
        }
    }),
    cache.invalidate('inventory:*'),
    inventoryController.update
);

/**
 * @swagger
 * /inventory/product/{productId}:
 *   get:
 *     tags: [Inventario]
 *     summary: Obtener movimientos por producto
 *     description: Obtiene los movimientos de inventario para un producto específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
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
 *         description: Cantidad de movimientos por página
 *     responses:
 *       200:
 *         description: Movimientos obtenidos exitosamente
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
 *                     movements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryMovement'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/product/:productId',
    authMiddleware.verifyToken,
    cache.cache(300), // Cachear por 5 minutos
    inventoryController.getProductMovements
);

/**
 * @swagger
 * /inventory/location/{location}:
 *   get:
 *     tags: [Inventario]
 *     summary: Obtener movimientos por ubicación
 *     description: Obtiene los movimientos de inventario para una ubicación específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de ubicación
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
 *         description: Cantidad de movimientos por página
 *     responses:
 *       200:
 *         description: Movimientos obtenidos exitosamente
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
 *                     movements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryMovement'
 *                     total:
 *                       type: integer
 *                       example: 30
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/location/:location',
    authMiddleware.verifyToken,
    cache.cache(300), // Cachear por 5 minutos
    inventoryController.getLocationMovements
);

// Rutas públicas con caché
router.get('/stats', cacheMiddleware(600), inventoryController.getInventoryStats);
router.get('/low-stock', cacheMiddleware(300), inventoryController.getLowStockProducts);
router.get('/zone/:zone', cacheMiddleware(300), inventoryController.getProductsByZone);
router.get('/:sku', cacheMiddleware(300), inventoryController.getProductBySKU);

// Rutas protegidas (requieren autenticación y rol específico)
router.post('/', 
    checkRole(['admin', 'inventory_manager']),
    validateProduct,
    inventoryController.createProduct
);

router.put('/:sku',
    checkRole(['admin', 'inventory_manager']),
    validateProduct,
    inventoryController.updateProduct
);

router.put('/:sku/stock',
    checkRole(['admin', 'inventory_manager', 'warehouse_staff']),
    validateStockUpdate,
    inventoryController.updateStock
);

router.delete('/:sku',
    checkRole(['admin']),
    inventoryController.deleteProduct
);

module.exports = router; 