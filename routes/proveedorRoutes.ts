import { Router } from 'express';
import { verificarToken } from '../middlewares/authMiddleware';
import { obtenerProveedores, crearProveedor, actualizarProveedor, desactivarProveedor } from '../controllers/proveedorController';
import { esAdmin } from '../middlewares/rolValidator';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Proveedor:
 *       type: object
 *       required:
 *         - razon_social
 *       properties:
 *         razon_social:
 *           type: string
 *           description: Nombre de la empresa o distribuidor
 *         telefono:
 *           type: string
 *           description: Teléfono de contacto
 *         correo:
 *           type: string
 *           description: Correo electrónico del proveedor
 *       example:
 *         razon_social: Distribuidora Farmacéutica Nacional
 *         telefono: "4491234567"
 *         correo: contacto@distribuidora.com
 */

/**
 * @swagger
 * /api/proveedores:
 *   get:
 *     summary: Obtiene la lista de proveedores activos
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarToken, obtenerProveedores);

/**
 * @swagger
 * /api/proveedores:
 *   post:
 *     summary: Registra un nuevo proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proveedor'
 *     responses:
 *       201:
 *         description: Proveedor creado exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/', verificarToken, esAdmin, crearProveedor);

/**
 * @swagger
 * /api/proveedores/{id}:
 *   put:
 *     summary: Actualiza los datos de un proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proveedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proveedor'
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 *       404:
 *         description: Proveedor no encontrado
 */
router.put('/:id', verificarToken, esAdmin, actualizarProveedor);

/**
 * @swagger
 * /api/proveedores/{id}:
 *   patch:
 *     summary: Da de baja a un proveedor (Borrado lógico)
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proveedor a desactivar
 *     responses:
 *       200:
 *         description: Proveedor desactivado exitosamente
 *       404:
 *         description: Proveedor no encontrado
 */

router.patch("/:id", verificarToken, esAdmin, desactivarProveedor);

export default router;