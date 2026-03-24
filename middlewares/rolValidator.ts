import { Request, Response, NextFunction } from 'express';

export const esAdmin = (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario;
    if (!usuario) {
        return res.status(500).json({ 
            error: "Error interno: Se intentó verificar el rol sin validar el token primero." 
        });
    }

    // ⚠️ AJUSTA ESTO según cómo tengas tu tabla de usuarios. 
    // Puede ser usuario.rol !== 'ADMIN' o usuario.id_rol !== 1
    if (usuario.rol !== 'Administrador') { 
        return res.status(403).json({ 
            error: "Acceso denegado. Se requieren privilegios de Administrador para esta acción." 
        });
    }

    next();
};