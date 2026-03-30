import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db";

// 1. Definimos los atributos del modelo
interface UserAttributes {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: "Administrador" | "Vendedor";
  estado: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Para cuando se crea un usuario (id es opcional porque es autoincrement)
interface UserCreationAttributes extends Optional<UserAttributes, "id" | "rol" | "estado"> {}

// 3. Clase del modelo
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public nombre!: string;
  public apellido!: string;
  public email!: string;
  public password!: string;
  public rol!: "Administrador" | "Vendedor";
  public estado!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Inicializamos el modelo
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido:{
      type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM("Administrador", "Vendedor"),
      defaultValue: "Vendedor",
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    sequelize,
    tableName: "usuarios",
    timestamps: true,
  }
);

export default User;