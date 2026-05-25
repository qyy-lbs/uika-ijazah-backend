// src/middlewares/upload.middleware.ts
import multer from 'multer';

// Kita pakai memoryStorage agar file tidak langsung masuk ke folder 
// (kita bisa pilih mau disimpan dimana nantinya di dalam service)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Hanya izinkan mimetype image/png
  if (file.mimetype === 'image/png') {
    cb(null, true); // Lolos
  } else {
    // Tolak file dan kirim error
    cb(new Error('FORMAT_TIDAK_SAH'), false); 
  }
};

// 'any()' berarti menerima semua field dari FormData (teks dan file)
export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Opsional: Batasi maksimal 5MB agar server tidak penuh
  }
}).any();