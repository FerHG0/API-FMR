import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface DetalleVentaAttributes {
  id_detalle: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  id_venta: number;
  id_producto: number; 
  id_registro_lote: number; 
  requiere_control?: boolean;
}

interface DetalleCreationAttributes extends Optional<DetalleVentaAttributes, "id_detalle"> {}

class DetalleVenta extends Model<DetalleVentaAttributes, DetalleCreationAttributes> implements DetalleVentaAttributes {
  public id_detalle!: number;
  public cantidad!: number;
  public precio_unitario!: number;
  public subtotal!: number;
  public id_venta!: number;
  public id_producto!: number;
  public id_registro_lote!: number;
  public requiere_control!: boolean;
}

DetalleVenta.init({
  id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  id_venta: { type: DataTypes.INTEGER, allowNull: false },
  id_producto: { type: DataTypes.INTEGER, allowNull: false },
  id_registro_lote: { type: DataTypes.INTEGER, allowNull: false },
  requiere_control: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  sequelize,
  tableName: "detalle_ventas",
  timestamps: false 
});

export default DetalleVenta;