import { Router } from "express";
import { crearUsuario, loginUsuario, obtenerUsuarios, desactivarUsuario } from "../controllers/usuarioController";
import { verificarToken } from "../middlewares/authMiddleware";
import { esAdmin } from "../middlewares/rolValidator";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombre completo del usuario
 *         email:
 *           type: string
 *           description: Correo electrónico único
 *         password:
 *           type: string
 *           description: Contraseña en texto plano
 *         rol:
 *           type: string
 *           enum: [Administrador, Vendedor]
 *           description: Rol del usuario
 *       example:
 *         nombre: Carlos Vendedor
 *         email: carlos@farmaciarincon.com
 *         password: MiPasswordSeguro123
 *         rol: Vendedor/Administrador (solo puede ser uno de los dos tal cual las palabras con mayúscula)
 *     LoginReq:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *       example:
 *         email: carlos@farmaciarincon.com
 *         password: MiPasswordSeguro123
 */

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos faltantes o correo ya registrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/", verificarToken, esAdmin, crearUsuario);

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Iniciar sesión y obtener token JWT
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginReq'
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve el token
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
router.post("/login", loginUsuario);

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtiene la lista de usuarios activos
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *       401:
 *         description: No autorizado, token faltante o inválido
 */

/**
 * @swagger
 * /api/usuarios/{id}:
 *   patch:
 *     summary: Desactiva un usuario (Borrado lógico)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario a desactivar
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
 *       401:
 *         description: No autorizado, token faltante o inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", verificarToken, obtenerUsuarios);
router.patch("/:id", verificarToken, esAdmin, desactivarUsuario);

export default router;