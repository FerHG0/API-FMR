import { Request, Response } from 'express';
import Doctor from '../models/Doctor';

// Crear un nuevo doctor
export const crearDoctor = async (req: Request, res: Response) => {
    try {
        const { nombre, apellido, cedula_profesional, domicilio_consultorio, especialidad } = req.body;

        // Validar si la cédula ya existe (si es que la enviaron)
        if (cedula_profesional) {
            const existeDoctor = await Doctor.findOne({ where: { cedula_profesional } });
            if (existeDoctor) {
                return res.status(400).json({ 
                    ok: false, 
                    msg: 'Ya existe un doctor registrado con esa cédula profesional' 
                });
            }
        }

        const nuevoDoctor = await Doctor.create({
            nombre,
            apellido,
            cedula_profesional,
            domicilio_consultorio,
            especialidad
        });

        res.status(201).json({
            ok: true,
            doctor: nuevoDoctor
        });

    } catch (error) {
        console.error('Error al crear doctor:', error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }
};

// Obtener lista de doctores (Para el Select del Frontend)
export const obtenerDoctores = async (req: Request, res: Response) => {
    try {
        const doctores = await Doctor.findAll({
            where: { estado: true }, // <--- Solo traemos los activos
            order: [['nombre_completo', 'ASC']]
        });
        res.json({ ok: true, doctores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener doctores' });
    }
};

// Borrado Lógico de un Doctor (Desactivar)
export const eliminarDoctor = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
        const doctor = await Doctor.findByPk(id);
        
        if (!doctor) {
            return res.status(404).json({ ok: false, msg: 'No existe un doctor con ese ID' });
        }

        // En lugar de destroy(), actualizamos el estado
        await doctor.update({ estado: false });

        res.json({ ok: true, msg: 'Doctor desactivado correctamente', doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al desactivar el doctor' });
    }
};