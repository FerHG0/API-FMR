import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Esta URL debe coincidir con la que pusiste en Cloud Console
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });
// Este ID lo sacas de la URL de la carpeta en tu Drive personal que compartiste con la Service Account
// Ej: https://drive.google.com/drive/folders/1A2b3C4d5E6f7G8h9I0j?usp=sharing -> El ID es "1A2b3C4d5E6f7G8h9I0j"
const PARENT_FOLDER_ID = process.env.DRIVE_PARENT_FOLDER_ID || 'TU_ID_DE_CARPETA_AQUI';

/**
 * Busca si la carpeta del día ya existe. Si no, la crea.
 */
async function getOrCreateDailyFolder(dateStr: string): Promise<string> {
  const folderName = `Respaldo_${dateStr}`;
  
  try {
    // 1. Buscamos si ya existe una carpeta con ese nombre en nuestro directorio padre
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${PARENT_FOLDER_ID}' in parents and trashed=false`;
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    // 2. Si la encuentra, devolvemos el ID existente
    if (response.data.files && response.data.files.length > 0) {
      console.log(` Carpeta existente encontrada en Drive: ${folderName}`);
      return response.data.files[0].id!;
    }

    // 3. Si no existe, la creamos
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [PARENT_FOLDER_ID]
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id'
    });
    
    console.log(`Nueva carpeta creada en Drive: ${folderName}`);
    return folder.data.id!;
  } catch (error) {
    console.error('Error buscando/creando la carpeta en Drive:', error);
    throw error;
  }
}

/**
 * Sube un archivo a Drive usando Streams y lo elimina del Droplet al terminar
 */
export async function uploadToDriveAndCleanUp(
  filePath: string, 
  dateStr: string, 
  mimeType: string = 'application/zip'
): Promise<void> {
  try {
    console.log(`Iniciando subida a Drive del archivo: ${filePath}`);
    
    // 1. Crear la carpeta del día (o podrías modificar la función para buscar si ya existe)
    const folderId = await getOrCreateDailyFolder(dateStr);

    // 2. Configurar los metadatos del archivo
    const fileName = path.basename(filePath);
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    // 3. Configurar el flujo (Stream) de lectura
    // ¡Crucial para el Droplet! Leemos el archivo del disco en pedacitos, no a la RAM.
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };

    // 4. Ejecutar la subida a Google Drive
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });

    console.log(`Archivo subido exitosamente a Drive con ID: ${response.data.id}`);

    // 5. Eliminar el archivo local para liberar espacio en el Droplet
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`⚠️ Error al eliminar el archivo local ${filePath}:`, err);
      } else {
        console.log(`Archivo local ${fileName} eliminado para liberar espacio.`);
      }
    });

  } catch (error) {
    console.error('Error durante la subida a Drive:', error);
    throw error;
  }
}