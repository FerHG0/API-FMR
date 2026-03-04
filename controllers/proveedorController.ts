import { Request, Response } from "express";
import { Proveedor } from "../models";

// Interface para el body al crear proveedor
interface CrearProveedorBody {
  razon_social: string;
  telefono?: string;
  correo?: string;
}

// Crear un nuevo proveedor
export const crearProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razon_social, telefono, correo }: CrearProveedorBody = req.body;

    const nuevo = await Proveedor.create({ razon_social, telefono, correo });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    res.status(500).json({ error: "Error al crear proveedor" });
  }
};

// Obtener todos los proveedores activos
export const obtenerProveedores = async (req: Request, res: Response): Promise<void> => {
  try {
    const lista = await Proveedor.findAll({ where: { estado: true } });

    res.status(200).json(lista);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
};

// Actualizar datos del proveedor
export const actualizarProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      res.status(404).json({ error: "No existe" });
      return;
    }

    await proveedor.update(req.body);

    res.status(200).json({ mensaje: "Proveedor actualizado", proveedor });
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ error: "Error al actualizar" });
  }
};

// Desactivar proveedor (Borrado lógico)
export const desactivarProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      res.status(404).json({ error: "No existe" });
      return;
    }

    (proveedor as any).estado = false;
    await proveedor.save();

    res.status(200).json({ mensaje: "Proveedor desactivado" });
  } catch (error) {
    console.error("Error al desactivar proveedor:", error);
    res.status(500).json({ error: "Error al desactivar" });
  }
};