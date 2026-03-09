import { body } from "express-validator";

export const validarProducto = [
  body("codigo_barras")
    .notEmpty().withMessage("El código de barras es obligatorio")
    .isLength({ min: 6 }).withMessage("El código de barras debe tener al menos 6 caracteres"),

  body("nombre_comercial")
    .notEmpty().withMessage("El nombre comercial es obligatorio")
    .isLength({ min: 3 }).withMessage("El nombre debe tener al menos 3 caracteres"),

  body("precio_costo")
    .notEmpty().withMessage("El precio de costo es obligatorio")
    .isFloat({ min: 0 }).withMessage("El precio de costo debe ser un número válido"),

  body("precio_venta")
    .notEmpty().withMessage("El precio de venta es obligatorio")
    .isFloat({ min: 0 }).withMessage("El precio de venta debe ser un número válido")
];