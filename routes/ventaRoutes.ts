// routes/ventaRoutes.ts
import { Router } from 'express';
import { registrarVenta, obtenerVentas } from '../controllers/ventaController';
import { verificarToken } from '../middlewares/authMiddleware';
import { esAdmin } from '../middlewares/rolValidator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ventas
 *   description: Gestión de tickets y cobros en mostrador
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Venta:
 *       type: object
 *       properties:
 *         id_venta:
 *           type: integer
 *         total:
 *           type: number
 *           format: float
 *         dinero_recibido:
 *           type: number
 *           format: float
 *         cambio:
 *           type: number
 *           format: float
 *         id_usuario:
 *           type: integer
 *         id_cliente:
 *           type: integer
 *           nullable: true
 *         id_doctor:
 *           type: integer
 *           nullable: true
 *         tipo_salida:
 *           type: string
 *           nullable: true
 *         folio_receta:
 *           type: string
 *           nullable: true
 *         fecha_venta:
 *           type: string
 *           format: date-time
 *       example:
 *         id_venta: 1024
 *         total: 345.50
 *         dinero_recibido: 500.00
 *         cambio: 154.50
 *         id_usuario: 3
 *         id_cliente: 1
 *         id_doctor: 2
 *         tipo_salida: "MR"
 *         folio_receta: "REC-9922"
 *         fecha_venta: "2026-03-24T15:30:00.000Z"
 */

/**
 * @swagger
 * /api/ventas:
 *   post:
 *     summary: Registra una nueva venta en el punto de venta
 *     description: Procesa un ticket de venta y descuenta stock del lote especificado.
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dinero_recibido
 *               - detalles
 *             properties:
 *               dinero_recibido:
 *                 type: number
 *                 format: float
 *                 example: 500.00
 *               id_cliente:
 *                 type: integer
 *                 example: 1
 *               id_doctor:
 *                 type: integer
 *                 description: ID del doctor. Obligatorio si hay antibióticos en el carrito.
 *                 example: 2
 *               tipo_salida:
 *                 type: string
 *                 description: Identificador de farmacia (ej. MR o SR)
 *                 example: "MR"
 *               folio_receta:
 *                 type: string
 *                 example: "REC-99882"
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_producto
 *                     - id_registro_lote
 *                     - cantidad
 *                   properties:
 *                     id_producto:
 *                       type: integer
 *                       example: 10
 *                     id_registro_lote:
 *                       type: integer
 *                       example: 5
 *                     cantidad:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Venta registrada y procesada exitosamente.
 *       400:
 *         description: Error de validación, lógica de negocio o fondos insuficientes.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno crítico.
 */
router.post('/', verificarToken, registrarVenta);

/**
 * @swagger
 * /api/ventas:
 *   get:
 *     summary: Obtiene el historial de todas las ventas
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ventas ordenadas por fecha reciente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Venta'
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verificarToken, obtenerVentas);

export default router;