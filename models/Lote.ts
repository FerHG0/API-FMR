import { DataTypes } from "sequelize";
import sequelize from "../config/db";

const Lote = sequelize.define("Lote", {
  id_registro_lote: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_lote_fisico: { type: DataTypes.STRING(50), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  fecha_caducidad: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: "lotes",
  timestamps: true,
  createdAt: "fecha_ingreso",
  updatedAt: false,
  indexes: [
    { unique: true, fields: ["codigo_lote_fisico", "id_producto"] }
  ]
});

export default Lote;