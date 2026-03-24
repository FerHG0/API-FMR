// routes/loteRoutes.ts
import { Router } from 'express';
import { registrarLote, obtenerLotes, obtenerLotesPorProducto } from '../controllers/loteController';
import { verificarToken } from '../middlewares/authMiddleware';
import { esAdmin } from '../middlewares/rolValidator'; 

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Lotes
 *   description: Gestión de inventario físico y caducidades
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Lote:
 *       type: object
 *       required:
 *         - codigo_lote_fisico
 *         - cantidad
 *         - fecha_caducidad
 *         - id_proveedor
 *         - id_producto
 *       properties:
 *         id_registro_lote:
 *           type: integer
 *         codigo_lote_fisico:
 *           type: string
 *         cantidad:
 *           type: integer
 *         fecha_caducidad:
 *           type: string
 *           format: date
 *         factura:
 *           type: string
 *           description: Número de factura del proveedor (Opcional)
 *         observaciones:
 *           type: string
 *           description: Detalles adicionales del ingreso (Opcional)
 *         id_proveedor:
 *           type: integer
 *         id_producto:
 *           type: integer
 *       example:
 *         codigo_lote_fisico: "L2025-ABC123"
 *         cantidad: 200
 *         fecha_caducidad: "2025-12-31"
 *         factura: "FAC-99882"
 *         observaciones: "Cajas ligeramente dobladas"
 *         id_proveedor: 3
 *         id_producto: 15
 */

/**
 * @swagger
 * /api/lotes:
 *   post:
 *     summary: Ingresa un nuevo lote de medicamentos al inventario
 *     tags: [Lotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lote'
 *     responses:
 *       201:
 *         description: Lote registrado exitosamente.
 *       400:
 *         description: Error de validación (campos faltantes, cantidad inválida, código duplicado o error de llaves foráneas).
 *       401:
 *         description: No autorizado, token faltante o inválido.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/', verificarToken, registrarLote);

/**
 * @swagger
 * /api/lotes:
 *   get:
 *     summary: Obtiene todos los lotes ordenados por caducidad (PEPS)
 *     tags: [Lotes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de lotes en el inventario.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lote'
 *       401:
 *         description: No autorizado, token faltante o inválido.
 *       500:
 *         description: Error interno del servidor al consultar la base de datos.
 */
router.get('/', verificarToken, obtenerLotes);

/**
 * @swagger
 * /api/lotes/producto/{id_producto}:
 *   get:
 *     summary: Obtiene los lotes disponibles de un producto específico ordenados por caducidad (PEPS)
 *     tags: [Lotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a buscar en el inventario
 *     responses:
 *       200:
 *         description: Lista de lotes del producto especificado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lote'
 *       401:
 *         description: No autorizado, token faltante o inválido.
 *       404:
 *         description: No se encontraron lotes registrados para este producto.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/producto/:id_producto', verificarToken, obtenerLotesPorProducto);

export default router;