// routes/ventaRoutes.ts
import { Router } from 'express';
import { registrarVenta, obtenerVentas } from '../controllers/ventaController';
import { verificarToken } from '../middlewares/authMiddleware';

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
 *           description: ID autoincremental del ticket
 *         total:
 *           type: number
 *           format: float
 *           description: Total calculado por el servidor
 *         dinero_recibido:
 *           type: number
 *           format: float
 *           description: Cantidad entregada por el cliente
 *         cambio:
 *           type: number
 *           format: float
 *           description: Vuelto calculado automáticamente
 *         id_usuario:
 *           type: integer
 *           description: ID del cajero (extraído del token)
 *         id_cliente:
 *           type: integer
 *           nullable: true
 *           description: ID del cliente (puede ser nulo)
 *         fecha_venta:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la venta
 *       example:
 *         id_venta: 1024
 *         total: 345.50
 *         dinero_recibido: 500.00
 *         cambio: 154.50
 *         id_usuario: 3
 *         id_cliente: 1
 *         fecha_venta: "2025-03-19T15:30:00.000Z"
 */

/**
 * @swagger
 * /api/ventas:
 *   post:
 *     summary: Registra una nueva venta en el punto de venta
 *     description: Procesa un ticket de venta. Calcula automáticamente los subtotales y el total desde la base de datos, descuenta el stock de los lotes indicados y valida reglas de negocio (ej. antibióticos requieren cliente activo).
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
 *                 description: Monto entregado por el cliente para pagar.
 *                 example: 500.00
 *               id_cliente:
 *                 type: integer
 *                 description: ID del cliente. Opcional. Si el cliente está inactivo, la venta pasará como público general a menos que haya medicamentos controlados.
 *                 example: 1
 *               detalles:
 *                 type: array
 *                 description: Lista de productos en el carrito.
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
 *                       description: ID interno del lote del cual se descontará el stock físico.
 *                       example: 5
 *                     cantidad:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Venta registrada y procesada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Ticket procesado y stock descontado con éxito.
 *                 total_venta:
 *                   type: number
 *                   format: float
 *                   example: 345.50
 *                 cambio_a_entregar:
 *                   type: number
 *                   format: float
 *                   example: 154.50
 *                 id_venta:
 *                   type: integer
 *                   example: 1024
 *       400:
 *         description: Error de validación, lógica de negocio o fondos insuficientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: El medicamento 'Amoxicilina' requiere receta médica y solo puede venderse a un cliente registrado y activo.
 *       401:
 *         description: No autorizado (Falta token de usuario en el header).
 *       500:
 *         description: Error interno crítico al procesar la venta.
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