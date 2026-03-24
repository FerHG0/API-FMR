// src/automations/test-backup.ts
import 'dotenv/config';
import { createLocalBackup } from './services/backup.service';
import { uploadToDriveAndCleanUp } from './services/drive.service';
import { generateDailySalesReport } from './services/report.service';

async function runTest() {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    console.log('Iniciando rutina completa de respaldo y reporte...');
    
    // 1. Base de datos (.zip)
    const zipPath = await createLocalBackup();
    console.log('Subiendo Base de Datos a Drive...');
    await uploadToDriveAndCleanUp(zipPath, dateStr, 'application/zip');

    // 2. Reporte de Ventas (.xlsx)
    const excelPath = await generateDailySalesReport();
    console.log('Subiendo Excel a Drive...');
    // Usamos el mimeType correcto para Excel
    await uploadToDriveAndCleanUp(excelPath, dateStr, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    console.log('✅ ¡Rutina finalizada con éxito! Revisa la carpeta en Google Drive.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la rutina:', error);
    process.exit(1);
  }
}

runTest();