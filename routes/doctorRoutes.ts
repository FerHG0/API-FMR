// routes/doctorRoutes.ts
import { Router } from 'express';
import { crearDoctor, obtenerDoctores, eliminarDoctor, actualizarDoctor } from '../controllers/doctorController';
import { verificarToken } from '../middlewares/authMiddleware';
import { esAdmin } from '../middlewares/rolValidator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Doctores
 *   description: Gestión de médicos que emiten recetas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       required:
 *         - nombre_completo
 *         - domicilio_consultorio
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autogenerado del doctor
 *         nombre_completo:
 *           type: string
 *           description: Nombre del doctor
 *         cedula_profesional:
 *           type: string
 *           description: Cédula profesional (Opcional)
 *         domicilio_consultorio:
 *           type: string
 *           description: Dirección del consultorio para la receta
 *         especialidad:
 *           type: string
 *           description: Especialidad médica
 *         estado:
 *           type: boolean
 *           description: Si el doctor está activo en el sistema
 *       example:
 *         nombre_completo: "Dr. Juan Pérez"
 *         cedula_profesional: "1234567"
 *         domicilio_consultorio: "Av. Principal #123, Colonia Centro"
 *         especialidad: "Cardiología"
 *         estado: true
 */

/**
 * @swagger
 * /api/doctores:
 *   get:
 *     summary: Obtiene la lista de doctores activos
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de doctores obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verificarToken, obtenerDoctores);

/**
 * @swagger
 * /api/doctores:
 *   post:
 *     summary: Registra un nuevo doctor
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Doctor'
 *     responses:
 *       201:
 *         description: Doctor creado exitosamente
 *       400:
 *         description: La cédula profesional ya está registrada o datos inválidos
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', verificarToken, esAdmin, crearDoctor);

/**
 * @swagger
 * /api/doctores/{id}:
 *   put:
 *     summary: Actualiza los datos de un doctor existente
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del doctor a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Doctor'
 *     responses:
 *       200:
 *         description: Doctor actualizado exitosamente
 *       400:
 *         description: La cédula profesional ya está registrada por otro doctor
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       404:
 *         description: Doctor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', verificarToken, esAdmin, actualizarDoctor);

/**
 * @swagger
 * /api/doctores/{id}:
 *   delete:
 *     summary: Desactiva un doctor (Borrado Lógico)
 *     tags: [Doctores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del doctor a desactivar
 *     responses:
 *       200:
 *         description: Doctor desactivado exitosamente
 *       404:
 *         description: Doctor no encontrado
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', verificarToken, esAdmin, eliminarDoctor);

export default router;