import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayloadCustom {
  id: number;
  rol: string;
  iat?: number;
  exp?: number;
}

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Acceso denegado. No se proporcionó un token." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Formato de token inválido. Usa el formato Bearer." });
  }

  try {
    const payloadDecodificado = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayloadCustom;

    req.usuario = payloadDecodificado;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};