import { Request, Response, NextFunction } from "express";
import { ValidationError, UniqueConstraintError } from "sequelize";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {

  console.error("ERROR GLOBAL:", err);

  // Error de campo duplicado (ej: codigo_barras)
  if (err instanceof UniqueConstraintError) {
    return res.status(400).json({
      error: "Registro duplicado",
      detalle: "El valor que intentas registrar ya existe en la base de datos."
    });
  }

  // Error de validación de Sequelize
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: "Error de validación",
      detalle: err.errors.map(e => e.message)
    });
  }

  // Error general
  res.status(500).json({
    error: "Error interno del servidor",
    mensaje: err.message || "Ocurrió un error inesperado"
  });
};