import { Request, Response } from 'express';
import Doctor from '../models/Doctor';
import { Op } from 'sequelize'; // Importante para búsquedas complejas si las llegas a usar

// Crear un nuevo doctor
export const crearDoctor = async (req: Request, res: Response) => {
    try {
        const { nombre, apellido, cedula_profesional, domicilio_consultorio, especialidad, estado } = req.body;

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
            especialidad,
            estado: estado !== undefined ? estado : true
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

// Obtener lista de doctores (Soporta ver activos o inactivos)
export const obtenerDoctores = async (req: Request, res: Response) => {
    try {
        // Capturamos si el frontend pide ver los inactivos
        const inactivos = req.query.inactivos === 'true';

        const doctores = await Doctor.findAll({
            where: { estado: !inactivos }, // Si inactivos es true, busca estado: false
            order: [['nombre', 'ASC']] // 🔥 Arreglado: El modelo usa 'nombre', no 'nombre_completo'
        });
        
        res.json({ ok: true, doctores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al obtener doctores' });
    }
};

// 🔥 NUEVO: Actualizar un doctor existente
export const actualizarDoctor = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { nombre, apellido, cedula_profesional, domicilio_consultorio, especialidad, estado } = req.body;

    try {
        const doctor = await Doctor.findByPk(id);
        
        if (!doctor) {
            return res.status(404).json({ ok: false, msg: 'No existe un doctor con ese ID' });
        }

        // Si están intentando cambiar la cédula, verificamos que no pertenezca a OTRO doctor
        if (cedula_profesional && cedula_profesional !== doctor.cedula_profesional) {
            const existeCedula = await Doctor.findOne({ where: { cedula_profesional } });
            if (existeCedula) {
                return res.status(400).json({ 
                    ok: false, 
                    msg: 'Ya existe otro doctor registrado con esa cédula profesional' 
                });
            }
        }

        await doctor.update({
            nombre,
            apellido,
            cedula_profesional,
            domicilio_consultorio,
            especialidad,
            estado
        });

        res.json({ ok: true, msg: 'Doctor actualizado correctamente', doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al actualizar el doctor' });
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

        // Borrado lógico: lo pasamos a inactivo
        await doctor.update({ estado: false });

        res.json({ ok: true, msg: 'Doctor desactivado correctamente', doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al desactivar el doctor' });
    }
};