import cron from 'node-cron';
import { createLocalBackup, cleanOldBackups } from '../services/backup.service';
import { generateDailySalesReport } from '../services/report.service';
import { uploadToDriveAndCleanUp } from '../services/drive.service';

// Función orquestadora que ejecuta todo en orden
const runDailyRoutine = async () => {
    console.log('[CRON] Iniciando rutina nocturna de respaldos y reportes...');
    try {
        const dateStr = new Date().toISOString().split('T')[0];

        // 1. Limpiar respaldos viejos locales (Por si algo falló y se quedaron en el Droplet)
        cleanOldBackups();

        // 2. Generar Backup BD
        console.log('[CRON] Extrayendo base de datos...');
        const zipPath = await createLocalBackup();

        // 3. Generar Excel de Ventas
        console.log('[CRON] Generando reporte de ventas...');
        const excelPath = await generateDailySalesReport();

        // 4. Subir a Drive (Se suben a la misma carpeta gracias a tu cambio)
        console.log('[CRON] Subiendo archivos a Google Drive...');
        await uploadToDriveAndCleanUp(zipPath, dateStr, 'application/zip');
        await uploadToDriveAndCleanUp(excelPath, dateStr, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        console.log('[CRON] ¡Rutina nocturna finalizada con éxito!');
    } catch (error) {
        console.error('[CRON] Error crítico en la rutina nocturna:', error);
        // Aquí en el futuro podrías enviar un correo de alerta al dueño de la farmacia
    }
};

// Programar la tarea para las 23:55 (11:55 PM) todos los días
// Formato Cron: Minuto (55) Hora (23) Día del mes (*) Mes (*) Día de la semana (*)
export const startAutomations = () => {
    cron.schedule('55 23 * * *', () => {
        runDailyRoutine();
    }, {
        timezone: "America/Mexico_City"
    });
};