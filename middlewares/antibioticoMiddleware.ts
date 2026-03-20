import { Request, Response, NextFunction } from "express";
import Producto from "../models/Producto";

export const validarAntibioticos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const { productos, id_cliente } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        error: "La venta debe incluir productos."
      });
    }

    // obtener ids de productos
    const ids = productos.map((p: any) => p.id_producto);

    // buscar en BD
    const productosDB = await Producto.findAll({
      where: { id_producto: ids }
    });

    // verificar si alguno requiere receta
    const requiereControl = productosDB.some(
      (p) => p.requiere_receta === true
    );

    if (requiereControl && !id_cliente) {
      return res.status(400).json({
        error: "Este medicamento requiere registrar un cliente."
      });
    }

    next();

  } catch (error) {

    console.error("Error validando antibióticos:", error);

    res.status(500).json({
      error: "Error al validar medicamentos controlados"
    });

  }
};