import { Request, Response } from "express";
import Cliente from "../models/Cliente";

export const crearCliente = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, telefono, correo, identificacion } = req.body;

    if (!nombre || !identificacion) {
      return res.status(400).json({ error: "El nombre y la identificación son obligatorios" });
    }

    const existe = await Cliente.findOne({ where: { identificacion } });
    if (existe) {
      return res.status(409).json({ error: "Ya existe un cliente registrado con esta identificación (CURP)." });
    }

    const cliente = await Cliente.create({
      nombre,
      apellido,
      telefono,
      correo,
      identificacion,
      estado: true // Forzamos a que nazca activo
    });

    res.status(201).json({ mensaje: "Cliente registrado correctamente", cliente });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

// OBTENER CLIENTES (Soporta ?inactivos=true)
export const obtenerClientes = async (req: Request, res: Response) => {
  try {
    const { inactivos } = req.query;
    const condicion = inactivos === 'true' ? { estado: false } : { estado: true };

    const clientes = await Cliente.findAll({ 
      where: condicion,
      order: [['nombre', 'ASC']]
    });
    
    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener la lista de clientes" });
  }
};

export const obtenerClientePorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const cliente = await Cliente.findOne({ where: { id_cliente: id, estado: true } });

    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado o inactivo" });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: "Error interno al buscar el cliente" });
  }
};

export const actualizarCliente = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { identificacion } = req.body;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

    // Validar que el nuevo CURP no choque con otro cliente existente
    if (identificacion) {
      const existe = await Cliente.findOne({ where: { identificacion } });
      if (existe && existe.id_cliente !== id) {
        return res.status(409).json({ error: "Otra persona ya está registrada con esa identificación." });
      }
    }

    await cliente.update(req.body);
    res.json({ mensaje: "Cliente actualizado", cliente });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
};

// DAR DE BAJA O REACTIVAR (Borrado Lógico)
export const actualizarEstadoCliente = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const nuevoEstado = req.body.estado !== undefined ? req.body.estado : false;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

    await cliente.update({ estado: nuevoEstado });
    res.json({ mensaje: `El cliente ha sido ${nuevoEstado ? 'reactivado' : 'dado de baja'} correctamente.` });
  } catch (error) {
    res.status(500).json({ error: "Error interno al cambiar estado del cliente" });
  }
};

// ELIMINACIÓN PERMANENTE (Hard Delete)
export const eliminarClientePermanente = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

    // En un sistema real, aquí podrías validar si el cliente tiene ventas atadas antes de destruirlo.
    await cliente.destroy();
    res.json({ mensaje: 'Cliente eliminado de forma permanente del sistema.' });
  } catch (error: any) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'No se puede eliminar. Este cliente tiene ventas o recetas vinculadas a su expediente.' });
    }
    res.status(500).json({ error: 'Error al eliminar permanentemente.' });
  }
};