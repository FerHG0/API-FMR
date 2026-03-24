import { spawn } from 'child_process';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

// Define dónde se guardarán temporalmente antes de subir a Drive
const BACKUP_DIR = path.join(__dirname, '../../../backups');

// Asegurar que el directorio exista cuando arranque el servicio
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const createLocalBackup = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dateStr = new Date().toISOString().split('T')[0]; // Ej: 2026-03-23
    const fileName = `Respaldo_${dateStr}.zip`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // 1. Prepara el flujo de escritura al disco
    const output = fs.createWriteStream(filePath);
    
    // 2. Configura el compresor con el máximo nivel (9) para ahorrar espacio
    const archive = archiver('zip', {
      zlib: { level: 9 } 
    });

    output.on('close', () => {
      console.log(`Respaldo comprimido exitosamente: ${archive.pointer()} bytes totales.`);
      resolve(filePath);
    });

    archive.on('error', (err) => reject(err));

    // Conecta el compresor con el archivo de salida
    archive.pipe(output);

    // 3. Ejecuta mysqldump
    const dbUser = process.env.DB_USER || 'root';
    const dbPass = process.env.DB_PASSWORD || 'FMR@123';
    const dbName = process.env.DB_NAME || 'FMR';
    const dump = spawn('mariadb-dump', [
      `-u${dbUser}`,
      `-p${dbPass}`,
      dbName
    ]);

    dump.stderr.on('data', (data) => {
      console.error(`Advertencia/Error en mysqldump: ${data}`);
    });

    // 4. Pasa el volcado directamente al ZIP
    archive.append(dump.stdout, { name: `database_${dateStr}.sql` });
    
    // Finaliza el proceso de compresión cuando mysqldump termine
    dump.on('close', (code) => {
      if (code === 0) {
        archive.finalize();
      } else {
        reject(new Error(`mysqldump finalizó con el código ${code}`));
      }
    });
  });
};

export const cleanOldBackups = (): void => {
  const MAX_AGE_DAYS = 7;
  const now = Date.now();

  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      console.error('Error leyendo el directorio de respaldos:', err);
      return;
    }

    files.forEach((file) => {
      if (!file.endsWith('.zip')) return;
      
      const filePath = path.join(BACKUP_DIR, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) return;

        // Calcula la edad del archivo en días
        const fileAgeDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        
        if (fileAgeDays > MAX_AGE_DAYS) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Error eliminando backup viejo (${file}):`, err);
            else console.log(`Mantenimiento: Backup viejo eliminado (${file})`);
          });
        }
      });
    });
  });
};