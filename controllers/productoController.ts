import { Request, Response } from 'express';
import Producto from '../models/Producto';

export const crearProducto = async (req: Request, res: Response) => {
  try {
    const { codigo_barras, nombre_comercial, sustancia_activa, precio_costo, precio_venta, requiere_receta } = req.body;

    if (!codigo_barras || !nombre_comercial || !precio_costo || !precio_venta || !requiere_receta) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el producto.' });
    }

    const productoExistente = await Producto.findOne({
      where: { codigo_barras }
    });

    if (productoExistente) {
      return res.status(409).json({
        error: "Ya existe un producto con este código de barras."
      });
    }

    const nuevoProducto = await Producto.create(req.body);
    res.status(201).json({
      mensaje: 'Producto registrado en el catálogo con éxito.',
      producto: nuevoProducto
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear el producto.' });
  }
};

export const obtenerProductos = async (_req: Request, res: Response) => {
  try {
    const productos = await Producto.findAll();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista de productos.' });
  }
};

export const actualizarProducto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    await producto.update(req.body);
    res.status(200).json({ mensaje: 'Producto actualizado correctamente.', producto });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el producto.' });
  }
};

export const obtenerProductoPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el producto." });
  }
};

export const eliminarProducto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    await producto.destroy();

    res.status(200).json({ mensaje: "Producto eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el producto." });
  }
};

export const scanProducto = async (req: Request, res: Response) => {
  try {

    const { codigo_barras } = req.body;

    if (!codigo_barras) {
      return res.status(400).json({
        error: "Debes enviar un código de barras."
      });
    }

    // Buscar producto
    let producto = await Producto.findOne({
      where: { codigo_barras }
    });

    // Si existe
    if (producto) {
      return res.status(200).json({
        mensaje: "Producto encontrado",
        producto
      });
    }

    // Si NO existe
    return res.status(404).json({
      mensaje: "Producto no registrado",
      codigo_barras
    });

  } catch (error) {

    console.error("Error en scan:", error);

    res.status(500).json({
      error: "Error al escanear producto"
    });

  }
};