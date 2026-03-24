import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

// Importamos tus modelos desde el index para asegurar que las relaciones existan
import { Venta, DetalleVenta, Producto, Cliente, Usuario, Lote } from '../../../models';

const BACKUP_DIR = path.join(__dirname, '../../../backups');

export const generateDailySalesReport = async (): Promise<string> => {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Reporte_Detallado_${dateStr}.xlsx`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // 1. Configurar rango de tiempo
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 Buscando ventas para el reporte...`);

    // 2. Consultar datos
    const ventas = await Venta.findAll({
        /* COMENTARIO PARA TEST: 
           Si la BD local no tiene ventas de HOY, comentar el 'where' 
           para que el Excel no salga vacío durante las pruebas.
        */
        where: {
            fecha_venta: {
                [Op.between]: [startOfDay, endOfDay]
            }
        },
        include: [
            { model: Cliente, attributes: ['nombre'] },
            { model: Usuario, attributes: ['nombre'] },
            { 
                model: DetalleVenta,
                include: [
                    { model: Producto, attributes: ['nombre_comercial'] },
                    { model: Lote, attributes: ['codigo_lote_fisico'] }
                ]
            }
        ]
    });

    console.log(`Ventas encontradas: ${ventas.length}`);

    // 3. Configurar ExcelJS Stream (Eficiencia de RAM)
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: filePath,
        useStyles: true
    });
    
    const worksheet = workbook.addWorksheet('Detalle de Ventas');

    worksheet.columns = [
        { header: 'Folio Venta', key: 'folio', width: 15 },
        { header: 'Fecha/Hora', key: 'fecha', width: 20 },
        { header: 'Cajero', key: 'cajero', width: 20 },
        { header: 'Cliente', key: 'cliente', width: 20 },
        { header: 'Producto', key: 'producto', width: 30 },
        { header: 'Lote', key: 'lote', width: 15 },
        { header: 'Cant.', key: 'cantidad', width: 10 },
        { header: 'Precio U.', key: 'precio', width: 12 },
        { header: 'Subtotal', key: 'subtotal', width: 12 },
        { header: 'Total Ticket', key: 'total', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };

   // 4. Llenado de datos con manejo de pluralización y objetos planos
    ventas.forEach(ventaInstance => {
        const venta = ventaInstance.get({ plain: true }) as any;
        
        // Imprimimos la primera venta para ver exactamente cómo Sequelize armó el JSON
        console.log("Estructura de la venta:", JSON.stringify(venta, null, 2));

        const detalles = venta.DetalleVentas || venta.DetalleVenta || [];

        // Atrapamos el objeto sin importar si Sequelize lo puso en mayúscula o minúscula
        const objUsuario = venta.User || venta.Usuario || venta.usuario || {};
        const objCliente = venta.Cliente || venta.cliente || {};

        if (detalles.length === 0) {
            console.warn(`Venta folio ${venta.id_venta} no tiene detalles.`);
        }

        detalles.forEach((detalle: any) => {
            const objProducto = detalle.Producto || detalle.producto || {};
            const objLote = detalle.Lote || detalle.lote || {};

            worksheet.addRow({
                folio: venta.id_venta,
                fecha: new Date(venta.fecha_venta).toLocaleString(),
                cajero: objUsuario.nombre || 'N/A',
                cliente: objCliente.nombre || 'Público General',
                producto: objProducto.nombre_comercial || 'Desconocido',
                lote: objLote.codigo_lote_fisico || 'N/A',
                cantidad: detalle.cantidad,
                precio: detalle.precio_unitario,
                subtotal: detalle.subtotal,
                total: venta.total
            }).commit(); 
        });
    });

    // 5. Guardar
    await worksheet.commit();
    await workbook.commit();

    console.log(`✅ Archivo Excel generado: ${fileName}`);
    return filePath;
};