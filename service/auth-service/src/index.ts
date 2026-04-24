import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js'; 
import unitRoutes from './routes/unitRoutes.js'; 

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware Keamanan dan Format Data
app.use(helmet()); // Mengamankan header server
app.use(cors()); // Mengizinkan Frontend mengakses API ini
app.use(express.json()); // Mengizinkan server membaca data JSON dari Frontend

// Menyambungkan Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/units', unitRoutes)

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Auth Service berjalan di http://localhost:${PORT}`);
});