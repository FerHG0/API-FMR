import Usuario from "./Usuario";
import Proveedor from "./Proveedor";
import Producto from "./Producto";
import Lote from "./Lote";
import Venta from "./Venta";
import DetalleVenta from "./DetalleVenta";

// --- DEFINICIÓN DE RELACIONES (Foreign Keys) ---

// 1. Usuario -> Ventas (Un usuario hace muchas ventas)
Usuario.hasMany(Venta, { foreignKey: "id_usuario" });
Venta.belongsTo(Usuario, { foreignKey: "id_usuario" });

// 2. Proveedor -> Lotes (Un proveedor trae muchos lotes)
Proveedor.hasMany(Lote, { foreignKey: "id_proveedor" });
Lote.belongsTo(Proveedor, { foreignKey: "id_proveedor" });

// 3. Producto -> Lotes (Un producto tiene muchos lotes físicos)
Producto.hasMany(Lote, { foreignKey: "id_producto" });
Lote.belongsTo(Producto, { foreignKey: "id_producto" });

// 4. Venta -> DetalleVenta (Una venta tiene muchos detalles/líneas)
Venta.hasMany(DetalleVenta, { foreignKey: "id_venta" });
DetalleVenta.belongsTo(Venta, { foreignKey: "id_venta" });

// 5. Producto -> DetalleVenta (Saber qué producto se vendió en esa línea)
Producto.hasMany(DetalleVenta, { foreignKey: "id_producto" });
DetalleVenta.belongsTo(Producto, { foreignKey: "id_producto" });

// 6. Lote -> DetalleVenta (Saber exactamente de qué lote se descontó)
Lote.hasMany(DetalleVenta, { foreignKey: "id_registro_lote" });
DetalleVenta.belongsTo(Lote, { foreignKey: "id_registro_lote" });

// Exportamos todos los modelos ya relacionados
export {
  Usuario,
  Proveedor,
  Producto,
  Lote,
  Venta,
  DetalleVenta
};