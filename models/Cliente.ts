import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface ClienteAttributes {
  id_cliente: number;
  nombre: string;
  telefono?: string;
  correo?: string;
  identificacion: string;
  fecha_registro?: Date;
  estado: boolean;
}

interface ClienteCreationAttributes extends Optional<ClienteAttributes, "id_cliente" | "fecha_registro"> {}

class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> implements ClienteAttributes {
  public id_cliente!: number;
  public nombre!: string;
  public telefono?: string;
  public correo?: string;
  public identificacion!: string;
  public fecha_registro?: Date;
  public estado!: boolean;
}

Cliente.init({
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20)
  },
  correo: {
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true
    }
  },
  identificacion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  estado: { // 3. Agregar a la definición de Sequelize
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  sequelize,
  tableName: "clientes",
  timestamps: false
});

export default Cliente;