// routes/clienteRoutes.ts
import { Router } from "express";
import {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
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
 *       properties:
 *         id_cliente:
 *           type: integer
 *           description: ID autoincremental del cliente
 *         nombre:
 *           type: string
 *           description: Nombre completo del cliente
 *         telefono:
 *           type: string
 *           description: Número de contacto
 *         correo:
 *           type: string
 *           description: Correo electrónico (opcional)
 *       example:
 *         nombre: "María García"
 *         telefono: "4491234567"
 *         correo: "maria.g@email.com"
 *         identificación: "GAHM190521HASRRAA6"
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
 */
router.put("/:id", verificarToken, esAdmin, actualizarCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente del sistema (borrado lógico)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a eliminar
 *     responses:
 *       200:
 *         description: Cliente eliminado (o desactivado)
 *       404:
 *         description: Cliente no encontrado
 */
router.delete("/:id", verificarToken, esAdmin, eliminarCliente);

export default router;