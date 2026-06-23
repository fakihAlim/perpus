import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Memproses, mengompresi sederhana, dan menyimpan file PDF.
 * @param file Objek File yang diunggah
 * @param uploadDir Folder tujuan relatif dari root project, misal 'public/uploads/books'
 * @returns Path relatif file yang disimpan
 */
export async function processAndSavePDF(file: File, uploadDir: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  
  try {
    // Coba kompresi sederhana dengan memuat ulang dan menyimpan dokumen
    // Ini bisa membuang objek yang tidak digunakan dan metadata berlebih
    const pdfDoc = await PDFDocument.load(bytes);
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    
    const buffer = Buffer.from(compressedBytes);
    const fullUploadDir = path.join(process.cwd(), uploadDir);
    await fs.mkdir(fullUploadDir, { recursive: true });

    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(fullUploadDir, safeFileName);
    await fs.writeFile(filePath, buffer);

    // Mengembalikan relative path yang bisa diakses di web, misal: /uploads/books/file.pdf
    const webPath = `/${uploadDir.replace('public/', '')}/${safeFileName}`;
    // Hapus double slashes jika ada
    return webPath.replace(/\/\//g, '/');
  } catch (error) {
    console.error("Gagal memproses PDF, menyimpan file asli:", error);
    // Fallback: simpan tanpa modifikasi jika PDF bermasalah/terkunci
    const buffer = Buffer.from(bytes);
    const fullUploadDir = path.join(process.cwd(), uploadDir);
    await fs.mkdir(fullUploadDir, { recursive: true });

    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(fullUploadDir, safeFileName);
    await fs.writeFile(filePath, buffer);

    const webPath = `/${uploadDir.replace('public/', '')}/${safeFileName}`;
    return webPath.replace(/\/\//g, '/');
  }
}
