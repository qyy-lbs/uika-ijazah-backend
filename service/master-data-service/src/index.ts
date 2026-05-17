import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import unitRoutes from './routes/unitRoutes.js';
import usersRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3004; // Markas baru di Port 3004

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- DAFTAR RUTE (Gunakan awalan utuh agar cocok dengan Gateway) ---
app.use('/api/units', unitRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profile', profileRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'master-data-service' });
});

// Wajib 0.0.0.0 untuk Railway nanti!
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ Master Data Service mengudara di Port ${PORT}`);
});