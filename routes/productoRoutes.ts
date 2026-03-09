import { Router } from "express";
import {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto
} from "../controllers/productoController";
import { verificarToken } from "../middlewares/authMiddleware";
import { scanProducto } from '../controllers/productoController';
import { validarProducto } from "../middlewares/productoValidator";
import { validarCampos } from "../middlewares/validationMiddlewere";


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión del catálogo general de productos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       required:
 *         - codigo_barras
 *         - nombre_comercial
 *         - precio_costo
 *         - precio_venta
 *       properties:
 *         id_producto:
 *           type: integer
 *           description: ID único del producto
 *         codigo_barras:
 *           type: string
 *           description: Código de barras del producto
 *         nombre_comercial:
 *           type: string
 *           description: Nombre comercial del medicamento
 *         sustancia_activa:
 *           type: string
 *           description: Sustancia activa del medicamento
 *         precio_costo:
 *           type: number
 *           format: float
 *         precio_venta:
 *           type: number
 *           format: float
 *         requiere:receta:
 *           type: boolean
 *           description: Indica si el medicamento requiere registro de cliente (antibióticos)
 * 
 *       example:
 *         id_producto: 1
 *         codigo_barras: "7501234567890"
 *         nombre_comercial: "Paracetamol 500mg"
 *         sustancia_activa: "Paracetamol"
 *         precio_costo: 20.50
 *         precio_venta: 35.00
 * 
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", verificarToken, obtenerProductos);

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get("/:id", verificarToken, obtenerProductoPorId);

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Registrar un nuevo producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             codigo_barras: "7501234567890"
 *             nombre_comercial: "Paracetamol 500mg"
 *             sustancia_activa: "Paracetamol"
 *             precio_costo: 12.50
 *             precio_venta: 18.00
 *             requiere_receta: true
 *     responses:
 *       201:
 *         description: Producto registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */

router.post("/", verificarToken, validarProducto, validarCampos, crearProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar completamente un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto a actualizar
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             codigo_barras: "7501234567890"
 *             nombre_comercial: "Paracetamol 500mg"
 *             sustancia_activa: "Paracetamol"
 *             precio_costo: 13.00
 *             precio_venta: 20.00
 *             requiere_receta: true
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put("/:id", verificarToken, actualizarProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   patch:
 *     summary: Actualizar parcialmente un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             precio_venta: 21.00
 *     responses:
 *       200:
 *         description: Producto actualizado parcialmente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno
 */

router.patch("/:id", verificarToken, actualizarProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto a eliminar
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete("/:id", verificarToken, eliminarProducto);
router.post('/scan', verificarToken, scanProducto);

export default router;