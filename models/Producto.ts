import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

// Define los atributos que tiene un Producto
interface ProductoAttributes {
  id_producto: number;
  codigo_barras: string;
  nombre_comercial: string;
  sustancia_activa?: string;
  precio_costo: number;
  precio_venta: number;
}

interface ProductoCreationAttributes extends Optional<ProductoAttributes, "id_producto"> {}

class Producto extends Model<ProductoAttributes, ProductoCreationAttributes> implements ProductoAttributes {
  public id_producto!: number;
  public codigo_barras!: string;
  public nombre_comercial!: string;
  public sustancia_activa?: string;
  public precio_costo!: number;
  public precio_venta!: number;
}

Producto.init({
  id_producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_barras: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  nombre_comercial: { type: DataTypes.STRING(150), allowNull: false },
  sustancia_activa: { type: DataTypes.STRING(150) },
  precio_costo: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  precio_venta: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  sequelize,
  tableName: "productos",
  timestamps: false
});

export default Producto;