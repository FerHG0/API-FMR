import { Request, Response } from 'express';
import Venta from '../models/Venta';
import DetalleVenta from '../models/DetalleVenta';
import Lote from '../models/Lote';
import sequelize from '../config/db'; 
import Producto from '../models/Producto';
import Cliente from '../models/Cliente';
import Doctor from '../models/Doctor';
import { waSocket } from '../src/whatsapp/bot.service';

export const registrarVenta = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { dinero_recibido, id_cliente, id_doctor, tipo_salida, folio_receta, detalles } = req.body;

    if (!dinero_recibido || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: "Faltan datos de cobro o el carrito está vacío." });
    }

    // 1. VALIDACIÓN FLEXIBLE DEL CLIENTE
    let clienteValido = false;
    let id_cliente_final = null; 

    if (id_cliente) {
      const cliente = await Cliente.findByPk(id_cliente, { transaction: t });
      if (cliente && cliente.estado) {
        clienteValido = true;
        id_cliente_final = id_cliente;
      }
    }

    // 1.5. VALIDACIÓN DEL DOCTOR (Nueva pieza clave)
    let doctorValido = false;
    let id_doctor_final = null;

    if (id_doctor) {
      const doctor = await Doctor.findByPk(id_doctor, { transaction: t });
      if (doctor && doctor.estado) {
        doctorValido = true;
        id_doctor_final = id_doctor;
      }
    }

    // 2. PRE-CÁLCULO MATEMÁTICO DIRECTO DE LA BD
    let totalCalculado = 0;

    for (const item of detalles) {
      if (!item.id_producto || !item.id_registro_lote || !item.cantidad) {
        throw new Error("Datos incompletos en el detalle de los productos.");
      }

      const producto = await Producto.findByPk(item.id_producto, { transaction: t });
      if (!producto) {
        throw new Error(`El producto con ID ${item.id_producto} no existe.`);
      }

      // VALIDACIÓN LEGAL DE FARMACIA: Antibiótico exige Cliente Y Doctor
      if (producto.requiere_receta) {
        if (!clienteValido) {
          throw new Error(`El medicamento '${producto.nombre_comercial}' requiere receta. Solo puede venderse a un cliente registrado y activo.`);
        }
        if (!doctorValido) {
          throw new Error(`El medicamento '${producto.nombre_comercial}' es un antibiótico. Debes asignar un Doctor válido y activo para la receta.`);
        }
      }

      item.precio_unitario = Number(producto.precio_venta); 
      item.subtotal = item.precio_unitario * item.cantidad;
      totalCalculado += item.subtotal;
      item.requiere_receta_seguro = producto.requiere_receta; 
    }

    const recibidoNum = Number(dinero_recibido);

    if (isNaN(recibidoNum) || totalCalculado <= 0 || recibidoNum < totalCalculado) {
      await t.rollback();
      return res.status(400).json({ error: "Cantidades de cobro inválidas o dinero insuficiente." });
    }

    const cambioCalculado = Number((recibidoNum - totalCalculado).toFixed(2));
    const id_usuario = (req as any).usuario.id; 

    // 3. ENCABEZADO DE LA VENTA
    const nuevaVenta = await Venta.create({
      total: totalCalculado,
      dinero_recibido: recibidoNum,
      cambio: cambioCalculado,
      id_usuario,
      id_cliente: id_cliente_final, 
      id_doctor: id_doctor_final,
      tipo_salida: tipo_salida,  
      folio_receta: folio_receta 
    }, { transaction: t });


    // 4. PROCESAMIENTO DE STOCK Y DETALLES
    const alertasInventario: any[] = [];

    for (const item of detalles) {
      const lote = await Lote.findByPk(item.id_registro_lote, { transaction: t });
      
      if (!lote) {
        throw new Error(`El lote con ID ${item.id_registro_lote} no existe.`);
      }

      if (lote.cantidad < item.cantidad) {
        throw new Error(`Inventario insuficiente. Solo quedan ${lote.cantidad} unidades en el lote ${lote.codigo_lote_fisico}.`);
      }

      lote.cantidad -= item.cantidad;
      await lote.save({ transaction: t });

      // 🚀 EVALUAMOS EL STOCK PARA LA ALERTA
      if (lote.cantidad <= 5) {
        // Buscamos el nombre del producto para que el mensaje sea legible
        const productoAlerta = await Producto.findByPk(item.id_producto, { transaction: t });
        alertasInventario.push({
            nombre: productoAlerta?.nombre_comercial || 'Producto Desconocido',
            cantidadRestante: lote.cantidad,
            loteFisico: lote.codigo_lote_fisico
        });
      }

      await DetalleVenta.create({
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario, 
        subtotal: item.subtotal,               
        id_venta: nuevaVenta.id_venta,         
        id_producto: item.id_producto,
        id_registro_lote: item.id_registro_lote,
        requiere_control: item.requiere_receta_seguro 
      }, { transaction: t });
    }

    // 5. CONFIRMA LOS CAMBIOS EN LA BD
    await t.commit();
// 🚀 DISPARO DE ALERTAS AUTOMÁTICAS (POST-COMMIT)
    if (alertasInventario.length > 0 && waSocket) {
      // Tomamos el primer número de la lista de admins
      const adminNumber = process.env.ADMIN_WHATSAPP_NUMBERS?.split(',')[0] + '@s.whatsapp.net';
      
      for (const alerta of alertasInventario) {
        const icono = alerta.cantidadRestante === 0 ? '❌' : '⚠️';
        const mensaje = `🚨 *ALERTA DE INVENTARIO AUTOMÁTICA* 🚨\n\nSe acaba de vender *${alerta.nombre}*.\nEl inventario del lote ${alerta.loteFisico} ha caído a nivel crítico: ${icono} *${alerta.cantidadRestante} unidades restantes*.\n\n_Atendido por: ID Usuario ${id_usuario}_`;
        
        try {
            await waSocket.sendMessage(adminNumber, { text: mensaje });
        } catch (error) {
            console.error("No se pudo enviar la alerta de WhatsApp:", error);
            // No hacemos throw error porque la venta ya fue exitosa, 
            // solo registramos que la notificación falló.
        }
      }
    }

    res.status(201).json({
      mensaje: "Ticket procesado y stock descontado con éxito.",
      total_venta: totalCalculado,
      cambio_a_entregar: cambioCalculado,
      id_venta: nuevaVenta.id_venta
    });

  } catch (error: any) {
    await t.rollback();
    console.error("Error en la transacción de venta:", error.message);
    
    if (
      error.message.includes("Inventario insuficiente") || 
      error.message.includes("Datos incompletos") || 
      error.message.includes("no existe") ||
      error.message.includes("requiere receta") ||
      error.message.includes("antibiótico") 
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error interno crítico al procesar la venta." });
  }

  
};

export const obtenerVentas = async (_req: Request, res: Response) => {
  try {
    const ventas = await Venta.findAll({
      order: [['fecha_venta', 'DESC']] 
    });
    res.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener el historial de ventas." });
  }
};