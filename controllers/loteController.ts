import { Request, Response } from 'express';
import Lote from '../models/Lote';
import { Op } from 'sequelize';
import { Proveedor, Producto } from '../models';

export const registrarLote = async (req: Request, res: Response) => {
  try {
    const { codigo_lote_fisico, cantidad, fecha_caducidad, factura, observaciones, id_proveedor, id_producto } = req.body;

    const proveedor = await Proveedor.findByPk(id_proveedor);
    if (!proveedor) return res.status(404).json({ error: "El proveedor indicado no existe." });
    if (!proveedor.estado) return res.status(403).json({ error: "Este proveedor está INACTIVO." });

    if (!codigo_lote_fisico || cantidad === undefined || !fecha_caducidad || !id_proveedor || !id_producto) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }
    if (cantidad <= 0) return res.status(400).json({ error: "La cantidad inicial debe ser mayor a cero." });

    const nuevoLote = await Lote.create(req.body);
    res.status(201).json({ mensaje: "Lote registrado exitosamente.", lote: nuevoLote });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "El código de lote ya existe en el sistema." });
    }
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// OBTENER LOTES (Filtra por Stock Activo o Agotados)
export const obtenerLotes = async (req: Request, res: Response) => {
  try {
    const { agotados } = req.query;
    
    // Si mandan ?agotados=true, buscamos cantidad 0. Si no, cantidad mayor a 0.
    const condicion = agotados === 'true' 
      ? { cantidad: 0 } 
      : { cantidad: { [Op.gt]: 0 } };

    const lotes = await Lote.findAll({ 
      where: condicion,
      include: [
        { model: Producto, attributes: ['nombre_comercial', 'imagen'] },
        { model: Proveedor, attributes: ['razon_social'] }
      ],
      order: [['fecha_caducidad', 'ASC']] 
    });
    res.json(lotes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el inventario de lotes." });
  }
};

// 3. OBTENER LOTES POR PRODUCTO
export const obtenerLotesPorProducto = async (req: Request, res: Response) => {
  try {
    const id_producto = Number(req.params.id_producto);

    const lotes = await Lote.findAll({
      where: { 
        id_producto: id_producto,
        cantidad: { [Op.gt]: 0 } // <--- Ignora los lotes "coloreados"/vacíos (Mayor a 0)
      },
      order: [['fecha_caducidad', 'ASC']] // PEPS
    });

    if (lotes.length === 0) {
      return res.status(404).json({ mensaje: "No hay stock disponible para este producto." });
    }

    res.json(lotes);

  } catch (error) {
    console.error("Error al buscar lotes del producto:", error);
    res.status(500).json({ error: "Error al buscar los lotes solicitados." });
  }
};

export const actualizarLote = async (req: Request, res: Response) => {
  try {
    // BLINDAJE: Atrapamos el ID sea como sea que se llame en tu loteRoutes.ts
    const idParam = req.params.id || req.params.id_registro_lote || req.params.id_lote;
    const idLote = parseInt(idParam as string);

    // Si no es un número válido, rebotamos la petición inmediatamente
    if (isNaN(idLote)) {
      return res.status(400).json({ error: 'El ID del lote proporcionado en la ruta no es válido.' });
    }

    const lote = await Lote.findByPk(idLote);
    
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado en la base de datos.' });
    }

    // Validar al proveedor al editar (opcional pero muy recomendado)
    const { id_proveedor } = req.body;
    if (id_proveedor) {
      const proveedor = await Proveedor.findByPk(id_proveedor);
      if (!proveedor) return res.status(404).json({ error: "El proveedor indicado no existe." });
      if (!proveedor.estado) return res.status(403).json({ error: "No puedes asignar este lote a un proveedor INACTIVO." });
    }

    await lote.update(req.body);
    res.json({ message: 'Lote actualizado correctamente.', lote });
    
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "Ya existe otro lote con este mismo código físico." });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: "El producto o el proveedor seleccionado no es válido." });
    }
    console.error("Error al actualizar lote:", error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el lote.' });
  }
};

// ELIMINAR PERMANENTEMENTE
export const eliminarLotePermanente = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id || req.params.id_registro_lote || req.params.id_lote;
    const idLote = parseInt(idParam as string);

    if (isNaN(idLote)) {
      return res.status(400).json({ error: 'El ID del lote proporcionado en la ruta no es válido.' });
    }

    const lote = await Lote.findByPk(idLote);
    
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });

    if (lote.cantidad > 0) {
      return res.status(400).json({ 
        error: 'Operación denegada. El lote aún cuenta con stock. Modifica la cantidad a 0 primero.' 
      });
    }

    await lote.destroy();
    res.json({ message: 'Lote eliminado de forma permanente del historial.' });
  } catch (error) {
    console.error("Error al eliminar permanentemente:", error);
    res.status(500).json({ error: 'Error interno al eliminar el lote.' });
  }
};