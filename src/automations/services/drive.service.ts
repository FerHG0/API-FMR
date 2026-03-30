import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const PARENT_FOLDER_ID = process.env.DRIVE_PARENT_FOLDER_ID || '';

// Cache en memoria de nombre de carpeta -> ID de Drive.
// Evita llamadas duplicadas a la API cuando se suben varios archivos
// a la misma carpeta dentro de la misma ejecucion (ej: zip + excel el mismo dia).
const folderCache = new Map<string, string>();

// ============================================================================
// BUSCAR O CREAR CARPETA EN DRIVE
// ============================================================================
async function getOrCreateFolder(folderName: string): Promise<string> {
    // Si ya fue resuelta en esta sesion, la devuelve directamente sin llamar a Drive
    if (folderCache.has(folderName)) {
        console.log(`[Drive] Carpeta obtenida del cache: ${folderName}`);
        return folderCache.get(folderName)!;
    }

    const query = [
        `mimeType='application/vnd.google-apps.folder'`,
        `name='${folderName}'`,
        `'${PARENT_FOLDER_ID}' in parents`,
        `trashed=false`
    ].join(' and ');

    const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
        const id = response.data.files[0].id!;
        console.log(`[Drive] Carpeta existente encontrada: ${folderName} (${id})`);
        folderCache.set(folderName, id);
        return id;
    }

    const folder = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [PARENT_FOLDER_ID]
        },
        fields: 'id'
    });

    const id = folder.data.id!;
    console.log(`[Drive] Nueva carpeta creada: ${folderName} (${id})`);
    folderCache.set(folderName, id);
    return id;
}

// ============================================================================
// SUBIR ARCHIVO A DRIVE Y ELIMINAR LOCAL
// Parametros:
//   filePath  - Ruta local del archivo a subir
//   folderName - Nombre de la carpeta destino en Drive (dentro de PARENT_FOLDER_ID)
//   mimeType  - MIME type del archivo (default: application/zip)
// ============================================================================
export async function uploadToDriveAndCleanUp(
    filePath: string,
    folderName: string,
    mimeType: string = 'application/zip'
): Promise<void> {
    console.log(`[Drive] Iniciando subida: ${path.basename(filePath)} -> ${folderName}`);

    try {
        const folderId = await getOrCreateFolder(folderName);

        // Usa Stream para leer el archivo en fragmentos, no cargarlo completo a RAM
        const media = {
            mimeType,
            body: fs.createReadStream(filePath)
        };

        const response = await drive.files.create({
            requestBody: {
                name: path.basename(filePath),
                parents: [folderId]
            },
            media,
            fields: 'id'
        });

        console.log(`[Drive] Subida exitosa. ID: ${response.data.id}`);

    } catch (error) {
        console.error('[Drive] Error durante la subida:', error);
        throw error;

    } finally {
        // El archivo local se elimina siempre: tanto si la subida fue exitosa
        // como si fallo. Asi no se acumulan archivos en el Droplet.
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`[Drive] No se pudo eliminar el archivo local ${filePath}:`, err);
                else console.log(`[Drive] Archivo local eliminado: ${path.basename(filePath)}`);
            });
        }
    }
}