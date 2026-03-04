import { Request, Response } from 'express';
import Producto from '../models/Producto';

export const crearProducto = async (req: Request, res: Response) => {
  try {
    const { codigo_barras, nombre_comercial, sustancia_activa, precio_costo, precio_venta } = req.body;

    // Validación básica
    if (!codigo_barras || !nombre_comercial || !precio_costo || !precio_venta) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el producto.' });
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
    const { id } = req.params;
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