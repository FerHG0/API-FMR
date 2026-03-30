import { Request, Response } from "express";
import Cliente from "../models/Cliente";

export const crearCliente = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, telefono, correo, identificacion, estado } = req.body;

    if (!nombre || !identificacion) {
      return res.status(400).json({
        error: "Nombre e identificación son obligatorios"
      });
    }

    const existe = await Cliente.findOne({
      where: { identificacion }
    });

    if (existe) {
      return res.status(400).json({
        error: "Ya existe un cliente con esa identificación"
      });
    }

    const cliente = await Cliente.create({
      nombre,
      apellido,
      telefono,
      correo,
      identificacion,
      estado
    });

    res.status(201).json({
      mensaje: "Cliente registrado correctamente",
      cliente
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

export const obtenerClientes = async (_req: Request, res: Response) => {
  try {
    const clientes = await Cliente.findAll({
      where: { estado: true } 
    });
    
    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener la lista de clientes activos" });
  }
};

export const obtenerClientePorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const cliente = await Cliente.findOne({
      where: { 
        id_cliente: id,
        estado: true 
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado o inactivo" });
    }

    res.json(cliente);

  } catch (error) {
    console.error("Error al buscar cliente:", error);
    res.status(500).json({ error: "Error interno al buscar el cliente" });
  }
};

export const actualizarCliente = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { identificacion } = req.body;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    if (identificacion) {
      const existe = await Cliente.findOne({
        where: { identificacion }
      });

      if (existe && existe.id_cliente !== id) {
        return res.status(400).json({
          error: "Otra persona ya tiene esa identificación"
        });
      }
    }

    await cliente.update(req.body);

    res.json({
      mensaje: "Cliente actualizado",
      cliente
    });

  } catch (error) {
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
};

export const eliminarCliente = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    cliente.estado = false;
    await cliente.save();

    res.json({
      mensaje: `El cliente ${cliente.nombre} ha sido desactivado del sistema correctamente.`
    });

  } catch (error) {
    console.error("Error al desactivar cliente:", error);
    res.status(500).json({ error: "Error interno del servidor al intentar desactivar el cliente" });
  }
};