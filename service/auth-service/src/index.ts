import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';



const app = express();

app.set('trust proxy', 1)
// 🔥 DEBUG SEMUA REQUEST MASUK KE AUTH SERVICE
app.use((req, res, next) => {
  console.log("AUTH HIT:", req.method, req.originalUrl);
  next();
});

// 1. RATE LIMITERS (Anti-Spam)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, //nanti diganti ke lebih kecil supaya aman 😊
  message: { status: 'error', message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' }
});


const PORT = process.env.PORT || 3002;

// Middleware Keamanan dan Format Data
app.use(helmet()); // Mengamankan header server
app.use(cors()); // Mengizinkan Frontend mengakses API ini
app.use(express.json()); // Mengizinkan server membaca data JSON dari Frontend

// Menyambungkan Routes
app.use('/api/auth', authRoutes);


// Jalankan Server
app.listen(Number(PORT), '0.0.0.0',() => {
  console.log(`Auth Service berjalan di http://localhost:${PORT}`);
});