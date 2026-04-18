
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';



const app = express();
const PORT = process.env.PORT || 3002;

// Middleware Keamanan dan Format Data
app.use(helmet()); // Mengamankan header server
app.use(cors()); // Mengizinkan Frontend mengakses API ini
app.use(express.json()); // Mengizinkan server membaca data JSON dari Frontend

// Menyambungkan Routes
app.use('/api/auth', authRoutes);

// Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service berjalan di http://localhost:${PORT}`);
});