import cron from 'node-cron';
import { createLocalBackup, cleanOldBackups } from '../services/backup.service';
import { generateDailySalesReport, generateMonthlySalesReport } from '../services/report.service';
import { uploadToDriveAndCleanUp } from '../services/drive.service';

// ============================================================================
// RUTINA DIARIA — Se ejecuta todos los dias a las 23:55
// ============================================================================
const runDailyRoutine = async (): Promise<void> => {
    console.log('[Cron Diario] Iniciando rutina nocturna...');
    const dateStr = new Date().toISOString().split('T')[0];

    try {
        console.log('[Cron Diario] Extrayendo base de datos...');
        const zipPath = await createLocalBackup();

        console.log('[Cron Diario] Generando reporte diario de ventas...');
        const excelPath = await generateDailySalesReport();

        // El nombre de la carpeta en Drive coincide con la convencion del servicio.
        // getOrCreateFolder usara el cache si ya existe de una llamada previa.
        const folderName = `Respaldo_${dateStr}`;

        console.log('[Cron Diario] Subiendo archivos a Google Drive...');
        await uploadToDriveAndCleanUp(zipPath, folderName, 'application/zip');
        await uploadToDriveAndCleanUp(
            excelPath,
            folderName,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        // La limpieza de backups antiguos se ejecuta al final para evitar
        // una condicion de carrera con el archivo que acabamos de generar.
        console.log('[Cron Diario] Eliminando respaldos antiguos...');
        cleanOldBackups();

        console.log('[Cron Diario] Rutina finalizada con exito.');

    } catch (error) {
        console.error('[Cron Diario] Error critico:', error);
    }
};

// ============================================================================
// RUTINA MENSUAL — Se ejecuta el dia 1 de cada mes a las 00:05
// ============================================================================
const runMonthlyRoutine = async (): Promise<void> => {
    console.log('[Cron Mensual] Iniciando corte de mes...');

    try {
        console.log('[Cron Mensual] Generando Excel del mes...');
        const excelPath = await generateMonthlySalesReport();

        // Carpeta separada en Drive para los cortes mensuales del anio en curso
        const folderName = `Cortes_Mensuales_${new Date().getFullYear()}`;

        console.log('[Cron Mensual] Subiendo reporte mensual a Google Drive...');
        await uploadToDriveAndCleanUp(
            excelPath,
            folderName,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        console.log('[Cron Mensual] Corte de mes finalizado con exito.');

    } catch (error) {
        console.error('[Cron Mensual] Error critico:', error);
    }
};

// ============================================================================
// PROGRAMACION DE TAREAS
// ============================================================================
export const startAutomations = (): void => {
    // Reporte diario y respaldo: todos los dias a las 23:55
    cron.schedule('55 23 * * *', () => {
        runDailyRoutine();
    }, {
        timezone: 'America/Mexico_City'
    });

    // Reporte mensual: el dia 1 de cada mes a las 00:05
    cron.schedule('5 0 1 * *', () => {
        runMonthlyRoutine();
    }, {
        timezone: 'America/Mexico_City'
    });

    console.log('[Automaciones] Modulo de automatizaciones activado.');
};