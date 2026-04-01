// routes/productoRoutes.ts
import { Router } from "express";
import {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  scanProducto
} from "../controllers/productoController";
import { verificarToken } from "../middlewares/authMiddleware";
import { validarProducto } from "../middlewares/productoValidator";
import { validarCampos } from "../middlewares/validationMiddlewere";
import { esAdmin } from '../middlewares/rolValidator';
import { upload, processImage } from "../middlewares/imagenesMiddlewere";

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
 *         presentacion:
 *           type: string
 *           description: Presentación física (ej. Caja con 20 tabletas)
 *         precio_costo:
 *           type: number
 *           format: float
 *         precio_venta:
 *           type: number
 *           format: float
 *         requiere_receta:
 *           type: boolean
 *           description: Indica si el medicamento requiere registro de receta médica (antibióticos)
 *         estado:
 *           type: boolean
 *           description: Indica si el producto está activo (Borrado lógico)
 *         imagen:
 *           type: string
 *           description: Nombre del archivo de imagen (ej. prod-123.webp)
 *       example:
 *         id_producto: 1
 *         codigo_barras: "7501234567890"
 *         nombre_comercial: "Amoxicilina"
 *         sustancia_activa: "Amoxicilina 500mg"
 *         presentacion: "Caja con 12 cápsulas"
 *         precio_costo: 35.50
 *         precio_venta: 80.00
 *         requiere_receta: true
 *         estado: true
 *         imagen: "prod-1711910000000.webp"
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos activos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 *       401:
 *         description: No autorizado, token faltante o inválido
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
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Datos del producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", verificarToken, obtenerProductoPorId);

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Registrar un nuevo producto con imagen
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               codigo_barras:
 *                 type: string
 *               nombre_comercial:
 *                 type: string
 *               sustancia_activa:
 *                 type: string
 *               presentacion:
 *                 type: string
 *               precio_costo:
 *                 type: number
 *               precio_venta:
 *                 type: number
 *               requiere_receta:
 *                 type: boolean
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del producto (JPG, PNG)
 *     responses:
 *       201:
 *         description: Producto registrado correctamente
 *       400:
 *         description: Datos inválidos o código de barras duplicado
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  "/",
  verificarToken,
  upload.single('imagen'),
  validarProducto,
  validarCampos,
  esAdmin,
  crearProducto
);

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar completamente un producto (con opción de nueva imagen)
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               codigo_barras:
 *                 type: string
 *               nombre_comercial:
 *                 type: string
 *               sustancia_activa:
 *                 type: string
 *               presentacion:
 *                 type: string
 *               precio_costo:
 *                 type: number
 *               precio_venta:
 *                 type: number
 *               requiere_receta:
 *                 type: boolean
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Nueva imagen del producto (opcional)
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  "/:id",
  verificarToken,
  upload.single('imagen'),
  esAdmin,
  actualizarProducto
);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               precio_venta:
 *                 type: number
 *                 format: float
 *               estado:
 *                 type: boolean
 *           example:
 *             precio_venta: 105.00
 *             estado: false
 *     responses:
 *       200:
 *         description: Producto actualizado parcialmente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch("/:id", verificarToken, actualizarProducto, esAdmin);

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Desactivar un producto (Borrado lógico)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto a desactivar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto desactivado correctamente
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete("/:id", verificarToken, eliminarProducto, esAdmin);

/**
 * @swagger
 * /api/productos/scan:
 *   post:
 *     summary: Buscar un producto activo por código de barras
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo_barras
 *             properties:
 *               codigo_barras:
 *                 type: string
 *           example:
 *             codigo_barras: "7501234567890"
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Código de barras no proporcionado
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       404:
 *         description: Producto no registrado o inactivo
 *       500:
 *         description: Error al escanear producto
 */
router.post('/scan', verificarToken, scanProducto);

export default router;