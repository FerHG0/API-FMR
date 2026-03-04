import { DataTypes } from "sequelize";
import sequelize from "../config/db";

const Venta = sequelize.define("Venta", {
  id_venta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  dinero_recibido: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cambio: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: "ventas",
  timestamps: true,
  createdAt: "fecha_venta",
  updatedAt: false
});

export default Venta;