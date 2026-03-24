import { DataTypes, Model } from 'sequelize';
import db from '../config/db';

class Doctor extends Model {
    public id!: number;
    public nombre_completo!: string;
    public cedula_profesional!: string | null;
    public domicilio_consultorio!: string;
    public especialidad!: string;
    public estado!: boolean;
}

Doctor.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre_completo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cedula_profesional: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    domicilio_consultorio: {
        type: DataTypes.STRING,
        allowNull: false, // Requisito de COFEPRIS, siempre debe haber dirección
    },
    especialidad: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Medicina General',
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // Por defecto empiezan activos
    }
}, {
    sequelize: db,
    tableName: 'doctores',
    timestamps: true, // Automáticamente crea createdAt y updatedAt
});

export default Doctor;