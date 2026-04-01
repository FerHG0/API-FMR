import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Configuración básica de Multer en memoria
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo no es una imagen válida'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Función para procesar la imagen con Sharp
export const processImage = async (fileBuffer: Buffer): Promise<string> => {
  const fileName = `prod-${Date.now()}.webp`;
const outputPath = path.join(process.cwd(), 'uploads', fileName);

  await sharp(fileBuffer)
    .resize(500, 500, { fit: 'cover' }) // Redimensionar a 500x500
    .webp({ quality: 80 })              // Convertir a WebP optimizado
    .toFile(outputPath);

  return fileName; // Devolvemos solo el nombre para guardarlo en la BD
};