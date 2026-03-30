import 'dotenv/config';
import { generateMonthlySalesReport } from './services/report.service';
import { uploadToDriveAndCleanUp } from './services/drive.service';

async function runTest() {
  try {
    console.log('🚀 Iniciando prueba del REPORTE MENSUAL...');

    // 1. Generar Reporte Mensual
    console.log('📅 Construyendo Excel...');
    const excelPath = await generateMonthlySalesReport();

    // 2. Subir a Drive
    console.log('☁️ Subiendo a Google Drive...');
    const folderName = `PRUEBA_MENSUAL_${new Date().getFullYear()}`;
    await uploadToDriveAndCleanUp(excelPath, folderName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    console.log('✅🎉 ¡Prueba de corte mensual finalizada con éxito! Revisa tu Drive.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    process.exit(1);
  }
}

runTest();