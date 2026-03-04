import { DataTypes } from "sequelize";
import sequelize from "../config/db";

const Proveedor = sequelize.define("Proveedor", {
  id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  razon_social: { type: DataTypes.STRING(150), allowNull: false },
  telefono: { type: DataTypes.STRING(15) },
  correo: { type: DataTypes.STRING(100) },
  estado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: "proveedores",
  timestamps: false
});

export default Proveedor;