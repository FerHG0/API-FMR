import { DataTypes } from "sequelize";
import sequelize from "../config/db";

const DetalleVenta = sequelize.define("DetalleVenta", {
  id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: "detalle_ventas",
  timestamps: false
});

export default DetalleVenta;