import { Op, literal } from 'sequelize';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

import { Venta, DetalleVenta, Producto, Cliente, Usuario, Lote, Proveedor, Doctor } from '../../../models';

// Usa una variable de entorno para que la ruta sea consistente entre desarrollo y producción.
// En el Droplet, define STORAGE_PATH=/home/fmr/storage en el .env
const BACKUP_DIR = process.env.STORAGE_PATH
    ? path.join(process.env.STORAGE_PATH, 'backups')
    : path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ============================================================================
// UTILIDADES
// ============================================================================
const colorRow = (row: ExcelJS.Row, hexColor: string): void => {
    row.eachCell({ includeEmpty: false }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexColor } };
    });
};

const formatDate = (value: any): string =>
    value ? new Date(value).toLocaleDateString('es-MX') : 'N/A';

const formatDateTime = (value: any): string =>
    value ? new Date(value).toLocaleString('es-MX') : 'N/A';

// ============================================================================
// FUNCION CONSTRUCTORA BASE
// ============================================================================
const buildReportBase = async (
    startDate: Date,
    endDate: Date,
    fileName: string,
    titleSuffix: string
): Promise<string> => {
    const filePath = path.join(BACKUP_DIR, fileName);
    console.log(`[Reporte] Construyendo: ${fileName}`);

    // Obtiene todos los datos en paralelo antes de escribir el Excel.
    // Esto reduce el tiempo total de generación significativamente.
    console.log('[Reporte] Consultando base de datos en paralelo...');
    const [
        controlados,
        entradas,
        salidas,
        productosStock,
        entradasAnti,
        salidasAnti
    ] = await Promise.all([
        // Hoja 1: Todos los productos controlados
        Producto.findAll({
            where: { requiere_receta: true },
            attributes: ['codigo_barras', 'nombre_comercial'],
            raw: true
        }),

        // Hoja 2: Entradas generales en el rango de fechas
        Lote.findAll({
            where: { fecha_ingreso: { [Op.between]: [startDate, endDate] } },
            include: [
                { model: Producto, attributes: ['codigo_barras', 'nombre_comercial', 'presentacion', 'precio_costo'] },
                { model: Proveedor, attributes: ['razon_social', 'domicilio'] }
            ]
        }),

        // Hoja 3: Salidas generales en el rango de fechas
        DetalleVenta.findAll({
            include: [
                {
                    model: Venta,
                    where: { fecha_venta: { [Op.between]: [startDate, endDate] } },
                    include: [{ model: Doctor, required: false }]
                },
                { model: Producto },
                { model: Lote }
            ]
        }),

        // Hoja 4: Stock con aggregados SQL — evita cargar cientos de registros en RAM.
        // NOTA: Ajusta los nombres de tabla ('lotes', 'detalle_ventas') y columna
        // ('producto_id') si difieren en tu esquema de base de datos.
        Producto.findAll({
    where: { requiere_receta: true },
    attributes: [
        'codigo_barras',
        'nombre_comercial',
        [
            // Cambiamos l.id_producto = Producto.id  =>  l.id_producto = Producto.id_producto
            literal('(SELECT COALESCE(SUM(l.cantidad), 0) FROM lotes l WHERE l.id_producto = Producto.id_producto)'),
            'stock_actual'
        ],
        [
            // Cambiamos dv.id_producto = Producto.id => dv.id_producto = Producto.id_producto
            literal('(SELECT COALESCE(SUM(dv.cantidad), 0) FROM detalle_ventas dv WHERE dv.id_producto = Producto.id_producto)'),
            'salidas_totales'
        ]
    ],
    raw: true
}),

        // Hoja 5: Entradas de antibioticos en el rango de fechas
        Lote.findAll({
            where: { fecha_ingreso: { [Op.between]: [startDate, endDate] } },
            include: [
                {
                    model: Producto,
                    attributes: ['codigo_barras', 'nombre_comercial', 'presentacion', 'precio_costo'],
                    where: { requiere_receta: true }
                },
                { model: Proveedor, attributes: ['razon_social', 'domicilio'] }
            ]
        }),

        // Hoja 6: Salidas de antibioticos en el rango de fechas
        DetalleVenta.findAll({
            include: [
                {
                    model: Venta,
                    where: { fecha_venta: { [Op.between]: [startDate, endDate] } },
                    include: [{ model: Doctor, required: false }]
                },
                { model: Producto, where: { requiere_receta: true } },
                { model: Lote }
            ]
        })
    ]);

    console.log('[Reporte] Datos obtenidos. Escribiendo Excel...');

    // Si la escritura del Excel falla a mitad, elimina el archivo parcial
    // para no dejar basura en disco.
    try {
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            filename: filePath,
            useStyles: true
        });

        // ------------------------------------------------------------------
        // HOJA 1: CONTROL
        // ------------------------------------------------------------------
        const sheetControl = workbook.addWorksheet('Control');
        sheetControl.mergeCells('A1:B1');
        const titleControl = sheetControl.getCell('A1');
        titleControl.value = 'ANTIBIOTICOS / CONTROLADOS';
        titleControl.font = { bold: true, size: 14 };
        titleControl.alignment = { horizontal: 'center' };

        sheetControl.columns = [
            { key: 'codigo', width: 25 },
            { key: 'nombre', width: 60 }
        ];

        const hControl = sheetControl.getRow(2);
        hControl.values = ['CODIGO', 'NOMBRE'];
        hControl.font = { bold: true };
        colorRow(hControl, 'FFB4C6E7');

        (controlados as any[]).forEach((prod) =>
            sheetControl.addRow({ codigo: prod.codigo_barras || 'S/C', nombre: prod.nombre_comercial }).commit()
        );
        sheetControl.commit();

        // ------------------------------------------------------------------
        // HOJA 2: ENTRADAS GENERALES
        // ------------------------------------------------------------------
        const sheetEntradas = workbook.addWorksheet('Entradas');
        sheetEntradas.mergeCells('A1:K2');
        const titleEntradas = sheetEntradas.getCell('A1');
        titleEntradas.value = `REGISTRO DE ENTRADAS ${titleSuffix}`;
        titleEntradas.font = { bold: true, size: 16 };
        titleEntradas.alignment = { horizontal: 'center', vertical: 'middle' };

        sheetEntradas.columns = [
            { key: 'fecha', width: 18 }, { key: 'codigo', width: 20 }, { key: 'precio', width: 15 },
            { key: 'cantidad', width: 12 }, { key: 'nombre', width: 40 }, { key: 'presentacion', width: 30 },
            { key: 'lote', width: 20 }, { key: 'caducidad', width: 18 }, { key: 'factura', width: 20 },
            { key: 'distribuidora', width: 35 }, { key: 'observaciones', width: 30 }
        ];

        const hEntradas = sheetEntradas.getRow(3);
        hEntradas.values = [
            'FECHA DE INGRESO', 'CODIGO DE PRODUCTO', 'PRECIO COSTO', 'CANTIDAD', 'NOMBRE',
            'PRESENTACION', 'LOTE', 'FECHA DE CADUCIDAD', 'NUMERO DE FACTURA',
            'CASA DISTRIBUIDORA Y DOMICILIO', 'OBSERVACIONES'
        ];
        hEntradas.font = { bold: true };
        colorRow(hEntradas, 'FFB4C6E7');

        entradas.forEach((loteInstance) => {
            const lote = loteInstance.get({ plain: true }) as any;
            const p = lote.Producto || lote.producto || {};
            const prov = lote.Proveedor || lote.proveedor || {};
            const row = sheetEntradas.addRow({
                fecha: formatDate(lote.fecha_ingreso),
                codigo: p.codigo_barras || 'S/C',
                precio: p.precio_costo || 0,
                cantidad: lote.cantidad,
                nombre: p.nombre_comercial || 'Desconocido',
                presentacion: p.presentacion || 'N/A',
                lote: lote.codigo_lote_fisico,
                caducidad: formatDate(lote.fecha_caducidad),
                factura: lote.factura || 'S/F',
                distribuidora: `${prov.razon_social || 'Desconocido'} - ${prov.domicilio || ''}`,
                observaciones: lote.observaciones || ''
            });
            if (lote.cantidad === 0) colorRow(row, 'FFFCE4D6');
            row.commit();
        });
        sheetEntradas.commit();

        // ------------------------------------------------------------------
        // HOJA 3: SALIDAS GENERALES
        // ------------------------------------------------------------------
        const sheetSalidas = workbook.addWorksheet('Salidas');
        sheetSalidas.mergeCells('A1:L2');
        const titleSalidas = sheetSalidas.getCell('A1');
        titleSalidas.value = `SALIDAS ${titleSuffix}`;
        titleSalidas.font = { bold: true, size: 16 };
        titleSalidas.alignment = { horizontal: 'center', vertical: 'middle' };

        sheetSalidas.columns = [
            { key: 'fecha', width: 22 }, { key: 'codigo', width: 20 }, { key: 'precio', width: 15 },
            { key: 'cantidad', width: 12 }, { key: 'nombre', width: 40 }, { key: 'presentacion', width: 30 },
            { key: 'lote', width: 20 }, { key: 'caducidad', width: 18 }, { key: 'medico', width: 30 },
            { key: 'cedula', width: 20 }, { key: 'domicilio', width: 30 }, { key: 'observaciones', width: 25 }
        ];

        const hSalidas = sheetSalidas.getRow(3);
        hSalidas.values = [
            'FECHA DE ENTREGA', 'CODIGO DE PRODUCTO', 'PRECIO DE VENTA', 'CANTIDAD', 'NOMBRE',
            'PRESENTACION', 'LOTE', 'FECHA DE CADUCIDAD', 'MEDICO QUE PRESCRIBE',
            'CEDULA PROFESIONAL', 'DOMICILIO DONDE SE PRESCRIBE', 'OBSERVACIONES'
        ];
        hSalidas.font = { bold: true };
        colorRow(hSalidas, 'FFB4C6E7');

        salidas.forEach((salidaInstance) => {
            const det = salidaInstance.get({ plain: true }) as any;
            const v = det.Venta || det.venta || det.Ventum || {};
            const p = det.Producto || det.producto || {};
            const l = det.Lote || det.lote || {};
            const doc = v.Doctor || v.doctor || {};
            const tieneDoctor = !!doc.nombre_completo;
            sheetSalidas.addRow({
                fecha: formatDateTime(v.fecha_venta),
                codigo: p.codigo_barras || 'S/C',
                precio: det.precio_unitario,
                cantidad: det.cantidad,
                nombre: p.nombre_comercial,
                presentacion: p.presentacion,
                lote: l.codigo_lote_fisico || 'N/A',
                caducidad: formatDate(l.fecha_caducidad),
                medico: tieneDoctor ? doc.nombre_completo : 'SR',
                cedula: tieneDoctor ? doc.cedula_profesional : 'N/A',
                domicilio: tieneDoctor ? doc.domicilio_consultorio : 'N/A',
                observaciones: v.observaciones || ''
            }).commit();
        });
        sheetSalidas.commit();

        // ------------------------------------------------------------------
        // HOJA 4: STOCK / INVENTARIO (con aggregados SQL)
        // ------------------------------------------------------------------
        const sheetStock = workbook.addWorksheet('Stock');
        sheetStock.columns = [
            { header: 'CODIGO', key: 'codigo', width: 20 },
            { header: 'NOMBRE', key: 'nombre', width: 45 },
            { header: 'ENTRADAS', key: 'entradas', width: 15 },
            { header: 'SALIDAS', key: 'salidas', width: 15 },
            { header: 'STOCK', key: 'stock', width: 15 }
        ];

        const hStock = sheetStock.getRow(1);
        hStock.font = { bold: true };
        colorRow(hStock, 'FFB4C6E7');

        (productosStock as any[]).forEach((prod) => {
            const stockActual = Number(prod.stock_actual) || 0;
            const salidasTotales = Number(prod.salidas_totales) || 0;
            const entradasOriginales = stockActual + salidasTotales;

            const row = sheetStock.addRow({
                codigo: prod.codigo_barras || 'S/C',
                nombre: prod.nombre_comercial,
                entradas: entradasOriginales,
                salidas: salidasTotales,
                stock: stockActual
            });

            if (stockActual === 0) colorRow(row, 'FFFFC7CE');
            else if (stockActual <= 5) colorRow(row, 'FFFFEB9C');
            else colorRow(row, 'FFC6EFCE');

            row.commit();
        });
        sheetStock.commit();

        // ------------------------------------------------------------------
        // HOJA 5: ENTRADAS ANTIBIOTICOS
        // ------------------------------------------------------------------
        const sheetEntradasAnti = workbook.addWorksheet('Entradas Antibioticos');
        sheetEntradasAnti.mergeCells('A1:K2');
        const titleEntradasAnti = sheetEntradasAnti.getCell('A1');
        titleEntradasAnti.value = `REGISTRO DE ENTRADAS ANTIBIOTICOS ${titleSuffix}`;
        titleEntradasAnti.font = { bold: true, size: 16 };
        titleEntradasAnti.alignment = { horizontal: 'center', vertical: 'middle' };

        sheetEntradasAnti.columns = [
            { key: 'fecha', width: 18 }, { key: 'codigo', width: 20 }, { key: 'precio', width: 15 },
            { key: 'cantidad', width: 12 }, { key: 'nombre', width: 40 }, { key: 'presentacion', width: 30 },
            { key: 'lote', width: 20 }, { key: 'caducidad', width: 18 }, { key: 'factura', width: 20 },
            { key: 'distribuidora', width: 35 }, { key: 'observaciones', width: 30 }
        ];

        const hEntradasAnti = sheetEntradasAnti.getRow(3);
        hEntradasAnti.values = [
            'FECHA DE INGRESO', 'CODIGO DE PRODUCTO', 'PRECIO COSTO', 'CANTIDAD', 'NOMBRE',
            'PRESENTACION', 'LOTE', 'FECHA DE CADUCIDAD', 'NUMERO DE FACTURA',
            'CASA DISTRIBUIDORA Y DOMICILIO', 'OBSERVACIONES'
        ];
        hEntradasAnti.font = { bold: true };
        colorRow(hEntradasAnti, 'FFC6EFCE');

        entradasAnti.forEach((loteInstance) => {
            const lote = loteInstance.get({ plain: true }) as any;
            const p = lote.Producto || lote.producto || {};
            const prov = lote.Proveedor || lote.proveedor || {};
            const row = sheetEntradasAnti.addRow({
                fecha: formatDate(lote.fecha_ingreso),
                codigo: p.codigo_barras || 'S/C',
                precio: p.precio_costo || 0,
                cantidad: lote.cantidad,
                nombre: p.nombre_comercial || 'Desconocido',
                presentacion: p.presentacion || 'N/A',
                lote: lote.codigo_lote_fisico,
                caducidad: formatDate(lote.fecha_caducidad),
                factura: lote.factura || 'S/F',
                distribuidora: `${prov.razon_social || 'Desconocido'} - ${prov.domicilio || ''}`,
                observaciones: lote.observaciones || ''
            });
            if (lote.cantidad === 0) colorRow(row, 'FFFCE4D6');
            row.commit();
        });
        sheetEntradasAnti.commit();

        // ------------------------------------------------------------------
        // HOJA 6: SALIDAS ANTIBIOTICOS
        // ------------------------------------------------------------------
        const sheetSalidasAnti = workbook.addWorksheet('Salidas Antibioticos');
        sheetSalidasAnti.mergeCells('A1:L2');
        const titleSalidasAnti = sheetSalidasAnti.getCell('A1');
        titleSalidasAnti.value = `REGISTRO DE SALIDAS ANTIBIOTICOS ${titleSuffix}`;
        titleSalidasAnti.font = { bold: true, size: 16 };
        titleSalidasAnti.alignment = { horizontal: 'center', vertical: 'middle' };

        sheetSalidasAnti.columns = [
            { key: 'fecha', width: 22 }, { key: 'codigo', width: 20 }, { key: 'precio', width: 15 },
            { key: 'cantidad', width: 12 }, { key: 'nombre', width: 40 }, { key: 'presentacion', width: 30 },
            { key: 'lote', width: 20 }, { key: 'caducidad', width: 18 }, { key: 'medico', width: 30 },
            { key: 'cedula', width: 20 }, { key: 'domicilio', width: 30 }, { key: 'observaciones', width: 25 }
        ];

        const hSalidasAnti = sheetSalidasAnti.getRow(3);
        hSalidasAnti.values = [
            'FECHA DE ENTREGA', 'CODIGO DE PRODUCTO', 'PRECIO DE VENTA', 'CANTIDAD', 'NOMBRE',
            'PRESENTACION', 'LOTE', 'FECHA DE CADUCIDAD', 'MEDICO QUE PRESCRIBE',
            'CEDULA PROFESIONAL', 'DOMICILIO DONDE SE PRESCRIBE', 'OBSERVACIONES'
        ];
        hSalidasAnti.font = { bold: true };
        colorRow(hSalidasAnti, 'FFC6EFCE');

        salidasAnti.forEach((salidaInstance) => {
            const det = salidaInstance.get({ plain: true }) as any;
            const v = det.Venta || det.venta || det.Ventum || {};
            const p = det.Producto || det.producto || {};
            const l = det.Lote || det.lote || {};
            const doc = v.Doctor || v.doctor || {};
            const tieneDoctor = !!doc.nombre_completo;
            sheetSalidasAnti.addRow({
                fecha: formatDateTime(v.fecha_venta),
                codigo: p.codigo_barras || 'S/C',
                precio: det.precio_unitario,
                cantidad: det.cantidad,
                nombre: p.nombre_comercial,
                presentacion: p.presentacion,
                lote: l.codigo_lote_fisico || 'N/A',
                caducidad: formatDate(l.fecha_caducidad),
                medico: tieneDoctor ? doc.nombre_completo : 'SR',
                cedula: tieneDoctor ? doc.cedula_profesional : 'N/A',
                domicilio: tieneDoctor ? doc.domicilio_consultorio : 'N/A',
                observaciones: v.observaciones || ''
            }).commit();
        });
        sheetSalidasAnti.commit();

        await workbook.commit();
        console.log(`[Reporte] Excel generado: ${fileName}`);
        return filePath;

    } catch (error) {
        // Elimina el archivo parcial para no dejar basura en disco
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, () => {});
        }
        throw error;
    }
};

// ============================================================================
// EXPORT 1: REPORTE DIARIO
// ============================================================================
export const generateDailySalesReport = async (targetDate: Date = new Date()): Promise<string> => {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const dateStr = startOfDay.toISOString().split('T')[0];

    return buildReportBase(startOfDay, endOfDay, `Reporte_Diario_${dateStr}.xlsx`, `DEL DIA: ${dateStr}`);
};

// ============================================================================
// EXPORT 2: REPORTE MENSUAL
// ============================================================================
export const generateMonthlySalesReport = async (): Promise<string> => {
    const now = new Date();
    // El cron se ejecuta el dia 1 del mes nuevo, por lo que restamos 1 mes
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthName = startOfMonth
        .toLocaleString('es-MX', { month: 'long' })
        .toUpperCase();
    const fileName = `Reporte_Mensual_${monthName}_${startOfMonth.getFullYear()}.xlsx`;

    return buildReportBase(
        startOfMonth,
        endOfMonth,
        fileName,
        `DEL MES DE ${monthName} ${startOfMonth.getFullYear()}`
    );
};

export const getLowStockReport = async () => {
    // Consultamos los productos que requieren receta (o todos, según prefieras)
    const productos = await Producto.findAll({
        attributes: [
            'nombre_comercial',
            [literal('(SELECT COALESCE(SUM(l.cantidad), 0) FROM lotes l WHERE l.id_producto = Producto.id_producto)'), 'stock_actual']
        ],
        where: { requiere_receta: true }, // Generalmente importa más el stock de controlados
        raw: true
    });

    // Filtramos los que tienen 5 o menos directamente en memoria para no complicar el SQL
    const criticos = (productos as any[])
        .filter(p => Number(p.stock_actual) <= 5)
        .sort((a, b) => Number(a.stock_actual) - Number(b.stock_actual));

    return criticos;
};