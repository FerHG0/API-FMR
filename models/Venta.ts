import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface VentaAttributes {
  id_venta: number;
  total: number;
  dinero_recibido: number;
  cambio: number;
  fecha_venta?: Date;
  id_usuario: number;
  id_cliente?: number | null; 
}

interface VentaCreationAttributes extends Optional<VentaAttributes, "id_venta" | "fecha_venta"> {}

class Venta extends Model<VentaAttributes, VentaCreationAttributes> implements VentaAttributes {
  public id_venta!: number;
  public total!: number;
  public dinero_recibido!: number;
  public cambio!: number;
  public readonly fecha_venta!: Date;
  public id_usuario!: number;
  public id_cliente?: number | null;
}

Venta.init({
  id_venta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  dinero_recibido: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cambio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  id_cliente: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null } // Permitimos nulos
}, {
  sequelize,
  tableName: "ventas",
  timestamps: true,
  createdAt: "fecha_venta", 
  updatedAt: false
});

export default Venta;