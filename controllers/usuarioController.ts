import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario } from "../models";


type RolUsuario = "Administrador" | "Vendedor";
// Interfaz para el body del usuario
interface CrearUsuarioBody {
  nombre: string;
  apellido: string
  email: string;
  password: string;
  rol?: RolUsuario;
}


// POST: Crear usuario
export const crearUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, password, rol }: CrearUsuarioBody = req.body;

    if (!nombre || !email || !password|| !apellido) {
      res.status(400).json({ error: "Es necesario completar los campos" });
      return;
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      res.status(400).json({ error: "El correo ya está registrado" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password: passwordEncriptada,
      rol: rol ?? "Vendedor"
    });

    res.status(201).json({
      mensaje: "Usuario creado exitosamente",
      usuario: {
        id_usuario: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error interno del servidor al crear el usuario" });
  }
};

// POST: Login
export const loginUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email y contraseña son obligatorios" });
      return;
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

    res.status(200).json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ error: "Error interno del servidor al iniciar sesión" });
  }
};

// GET: Obtener usuarios activos
export const obtenerUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ["password"] },
      where: { estado: true }
    });

    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// PATCH: Desactivar usuario
export const desactivarUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado en el sistema" });
      return;
    }

    usuario.estado = false;
    await usuario.save();

    res.status(200).json({
      mensaje: `El usuario ${usuario.nombre} ha sido dado de baja del sistema.`
    });

  } catch (error) {
    console.error("Error al desactivar usuario:", error);
    res.status(500).json({ error: "Error interno del servidor al desactivar usuario" });
  }
};