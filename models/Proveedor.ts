import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/db";

// 1. Definimos los atributos que tiene un Proveedor
interface ProveedorAttributes {
  id_proveedor: number;
  razon_social: string;
  telefono?: string;
  correo?: string;
  estado: boolean;
  domicilio?: string
}

// 2. Definimos cuáles son opcionales al momento de CREAR (id_proveedor es autoincremental)
interface ProveedorCreationAttributes extends Optional<ProveedorAttributes, "id_proveedor" | "estado"> {}

// 3. Creamos la Clase
class Proveedor 
  extends Model<ProveedorAttributes, ProveedorCreationAttributes> 
  implements ProveedorAttributes 
{
  public id_proveedor!: number;
  public razon_social!: string;
  public telefono?: string;
  public correo?: string;
  public estado!: boolean;
  public domicilio?: string | undefined;
}

// 4. Inicializamos
Proveedor.init({
  id_proveedor: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  razon_social: { 
    type: DataTypes.STRING(150), 
    allowNull: false 
  },
  telefono: { 
    type: DataTypes.STRING(15) 
  },
  correo: { 
    type: DataTypes.STRING(100) 
  },
  estado: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
  domicilio: {
    type: DataTypes.STRING,
    allowNull: true,
},
}, {
  sequelize,
  tableName: "proveedores",
  timestamps: false
});

export default Proveedor;