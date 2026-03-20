import { Request, Response } from 'express';
import Lote from '../models/Lote';

// 1. REGISTRAR LOTE
export const registrarLote = async (req: Request, res: Response) => {
  try {
    const { codigo_lote_fisico, cantidad, fecha_caducidad, id_proveedor, id_producto } = req.body;

    // Validación 1: Campos vacíos
    if (!codigo_lote_fisico || cantidad === undefined || !fecha_caducidad || !id_proveedor || !id_producto) {
      return res.status(400).json({ error: "Faltan campos obligatorios. Revisa el formulario." });
    }

    // Validación 2: Lógica de negocio
    if (cantidad <= 0) {
      return res.status(400).json({ error: "La cantidad del lote debe ser mayor a cero." });
    }

    const nuevoLote = await Lote.create(req.body);
    res.status(201).json({
      mensaje: "Lote registrado exitosamente en el inventario.",
      lote: nuevoLote
    });

  } catch (error: any) {

    // Error de índice único (Duplicado)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        error: "El código de lote ya existe para este producto. Verifica la mercancía." 
      });
    }

    // Error de llave foránea (Producto o Proveedor no existen)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        error: "El producto o el proveedor seleccionado no existe en la base de datos." 
      });
    }

    console.error("Error inesperado al registrar lote:", error);
    res.status(500).json({ error: "Error interno del servidor al registrar el lote." });
  }
};

// 2. OBTENER TODOS LOS LOTES (General)
export const obtenerLotes = async (_req: Request, res: Response) => {
  try {
    const lotes = await Lote.findAll({ order: [['fecha_caducidad', 'ASC']] });
    res.json(lotes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el inventario de lotes." });
  }
};

// 👇 3. NUEVO ENDPOINT: OBTENER LOTES POR PRODUCTO
export const obtenerLotesPorProducto = async (req: Request, res: Response) => {
  try {
    const id_producto = Number(req.params.id_producto);

    const lotes = await Lote.findAll({
      where: { 
        id_producto: id_producto,
      },
      order: [['fecha_caducidad', 'ASC']] // PEPS: Los que caducan antes, salen primero
    });

    if (lotes.length === 0) {
      return res.status(404).json({ mensaje: "No hay lotes registrados para este producto." });
    }

    res.json(lotes);

  } catch (error) {
    console.error("Error al buscar lotes del producto:", error);
    res.status(500).json({ error: "Error al buscar los lotes solicitados." });
  }
};