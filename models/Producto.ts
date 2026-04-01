import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

interface ProductoAttributes {
  id_producto: number;
  codigo_barras: string;
  nombre_comercial: string;
  sustancia_activa?: string;
  precio_costo: number;
  precio_venta: number;
  requiere_receta: boolean;
  presentacion: string;
  estado: boolean;
  imagen?: string;
}

interface ProductoCreationAttributes
  extends Optional<ProductoAttributes, "id_producto" | "requiere_receta"> {}

class Producto
  extends Model<ProductoAttributes, ProductoCreationAttributes>
  implements ProductoAttributes {

  public id_producto!: number;
  public codigo_barras!: string;
  public nombre_comercial!: string;
  public sustancia_activa?: string;
  public precio_costo!: number;
  public precio_venta!: number;
  public requiere_receta!: boolean;
  public presentacion!: string;
  public estado!: boolean; 
  public imagen!: string;
}

Producto.init(
{
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  codigo_barras: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },

  nombre_comercial: {
    type: DataTypes.STRING(150),
    allowNull: false
  },

  sustancia_activa: {
    type: DataTypes.STRING(150)
  },

  precio_costo: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },

  precio_venta: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },

  requiere_receta: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  presentacion:{
    type: DataTypes.STRING(150),
    allowNull: false
  },
  
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  imagen: {
  type: DataTypes.STRING(255),
  allowNull: true
}

},
{
  sequelize,
  tableName: "productos",
  timestamps: false
});

export default Producto;