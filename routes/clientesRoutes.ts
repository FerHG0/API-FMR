// routes/clienteRoutes.ts
import { Router } from "express";
import {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  actualizarEstadoCliente,
  eliminarClientePermanente,
} from "../controllers/clienteController";
import { verificarToken } from "../middlewares/authMiddleware";
import { esAdmin } from '../middlewares/rolValidator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes y pacientes de la farmacia
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Cliente:
 *       type: object
 *       required:
 *         - nombre
 *         - identificacion
 *       properties:
 *         id_cliente:
 *           type: integer
 *           description: ID autoincremental del cliente
 *         nombre:
 *           type: string
 *           description: Nombre(s) del cliente
 *         apellido:
 *           type: string
 *           description: Apellidos del cliente
 *         telefono:
 *           type: string
 *           description: Número de contacto
 *         correo:
 *           type: string
 *           description: Correo electrónico (opcional)
 *         identificacion:
 *           type: string
 *           description: CURP o Identificación oficial del cliente
 *         estado:
 *           type: boolean
 *           description: Indica si el cliente está activo en el sistema
 *       example:
 *         nombre: "María"
 *         apellido: "García"
 *         telefono: "4491234567"
 *         correo: "maria.g@email.com"
 *         identificacion: "GAHM190521HASRRAA6"
 *         estado: true
 */

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Registra un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       201:
 *         description: Cliente registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Identificación duplicada
 */
router.post("/", verificarToken, esAdmin, crearCliente);

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Obtiene la lista de todos los clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inactivos
 *         schema:
 *           type: string
 *         description: Si se envía "true", devuelve los clientes dados de baja.
 *     responses:
 *       200:
 *         description: Arreglo de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cliente'
 */
router.get("/", verificarToken, esAdmin, obtenerClientes);

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obtiene un cliente por su ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Datos del cliente encontrados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       404:
 *         description: Cliente no encontrado
 */
router.get("/:id", verificarToken, obtenerClientePorId);

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Actualiza la información de un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente
 *       404:
 *         description: Cliente no encontrado
 *       409:
 *         description: La nueva identificación ya pertenece a otro cliente
 */
router.put("/:id", verificarToken, esAdmin, actualizarCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   patch:
 *     summary: Da de baja o reactiva a un cliente (Borrado Lógico)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a cambiar de estado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: boolean
 *                 description: true para reactivar, false para dar de baja
 *     responses:
 *       200:
 *         description: Estado del cliente actualizado
 *       404:
 *         description: Cliente no encontrado
 */
router.patch("/:id", verificarToken, esAdmin, actualizarEstadoCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente de forma permanente (Hard Delete)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a eliminar definitivamente
 *     responses:
 *       200:
 *         description: Cliente eliminado permanentemente del sistema
 *       404:
 *         description: Cliente no encontrado
 *       409:
 *         description: No se puede eliminar por tener dependencias (ventas/recetas)
 */
router.delete("/:id", verificarToken, esAdmin, eliminarClientePermanente);

export default router;