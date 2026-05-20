import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import unitRoutes from './routes/unitRoutes.js';
import usersRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- DAFTAR RUTE ---
app.use('/api/unit', unitRoutes);
app.use('/api/user', usersRoutes);
app.use('/api/profile', profileRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'master-data-service' });
});

export default app;