import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

// Definimos los atributos exactos de tu diagrama
interface LoteAttributes {
  id_registro_lote: number;
  codigo_lote_fisico: string;
  cantidad: number;
  fecha_caducidad: string; // DATEONLY se maneja como string en TS (YYYY-MM-DD)
  fecha_ingreso?: Date;
  id_proveedor: number; // Llave foránea
  id_producto: number;  // Llave foránea
}

interface LoteCreationAttributes extends Optional<LoteAttributes, "id_registro_lote" | "cantidad"> {}

class Lote extends Model<LoteAttributes, LoteCreationAttributes> implements LoteAttributes {
  public id_registro_lote!: number;
  public codigo_lote_fisico!: string;
  public cantidad!: number;
  public fecha_caducidad!: string;
  public readonly fecha_ingreso!: Date;
  public id_proveedor!: number;
  public id_producto!: number;
}

Lote.init({
  id_registro_lote: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_lote_fisico: { type: DataTypes.STRING(50), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  fecha_caducidad: { type: DataTypes.DATEONLY, allowNull: false },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
  id_producto: { type: DataTypes.INTEGER, allowNull: false }
}, {
  sequelize,
  tableName: "lotes",
  timestamps: true,
  createdAt: "fecha_ingreso",
  updatedAt: false,
  indexes: [
    { unique: true, fields: ["codigo_lote_fisico", "id_producto"] } // ¡Excelente decisión este índice!
  ]
});

export default Lote;