import { spawn } from 'child_process';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = process.env.STORAGE_PATH
    ? path.join(process.env.STORAGE_PATH, 'backups')
    : path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ============================================================================
// CREAR RESPALDO LOCAL
// ============================================================================
export const createLocalBackup = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Respaldo_${dateStr}.zip`;
        const filePath = path.join(BACKUP_DIR, fileName);

        const output = fs.createWriteStream(filePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`[Backup] Comprimido exitosamente: ${archive.pointer()} bytes.`);
            resolve(filePath);
        });

        archive.on('error', (err) => {
            // Elimina el zip parcial si el archivador falla
            if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
            reject(err);
        });

        archive.pipe(output);

        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'FMR';

        // La contrasena se pasa como variable de entorno MYSQL_PWD al proceso hijo.
        // Esto evita que aparezca expuesta en "ps aux" o en los logs del sistema.
        const dump = spawn('mariadb-dump', [`-u${dbUser}`, dbName], {
            env: { ...process.env, MYSQL_PWD: dbPass }
        });

        dump.stderr.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            // mariadb-dump imprime advertencias de deprecated options a stderr;
            // solo las logueamos, no interrumpen el flujo.
            if (msg) console.warn(`[Backup] mariadb-dump stderr: ${msg}`);
        });

        archive.append(dump.stdout, { name: `database_${dateStr}.sql` });

        dump.on('close', (code) => {
            if (code === 0) {
                archive.finalize();
            } else {
                reject(new Error(`mariadb-dump finalizo con codigo de salida ${code}`));
            }
        });
    });
};

// ============================================================================
// LIMPIAR RESPALDOS ANTIGUOS (> 7 dias)
// ============================================================================
export const cleanOldBackups = (): void => {
    const MAX_AGE_DAYS = 7;
    const now = Date.now();

    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) {
            console.error('[Backup] Error leyendo directorio de respaldos:', err);
            return;
        }

        files
            .filter((file) => file.endsWith('.zip'))
            .forEach((file) => {
                const filePath = path.join(BACKUP_DIR, file);
                fs.stat(filePath, (statErr, stats) => {
                    if (statErr) {
                        console.error(`[Backup] No se pudo leer el archivo ${file}:`, statErr);
                        return;
                    }
                    const fileAgeDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
                    if (fileAgeDays > MAX_AGE_DAYS) {
                        fs.unlink(filePath, (unlinkErr) => {
                            if (unlinkErr) console.error(`[Backup] Error eliminando ${file}:`, unlinkErr);
                            else console.log(`[Backup] Respaldo antiguo eliminado: ${file}`);
                        });
                    }
                });
            });
    });
};