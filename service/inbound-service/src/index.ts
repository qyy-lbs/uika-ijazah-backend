import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { config } from './config/app';
import inboundRoutes from './routes/inbound.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();
app.use((req, res, next) => {
  console.log("ROUTE MASUK:", req.method, req.originalUrl);
  next();
});
app.set('trust proxy', 1)
const PORT = process.env.PORT || 3003;

// ── Security & CORS
app.use(helmet());
app.use(cors());

// ── Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger
app.use(morgan('dev'));

// ── Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'inbound-service',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes
app.use('/api/inbound', inboundRoutes);

// ── 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// ── Global error handler (harus di paling bawah)
app.use(errorHandler);

// ── Start server
app.listen(Number(PORT),'0.0.0.0', () => {
  console.log(`✅ Inbound Service berjalan di port ${config.port}`);
  console.log(`   Health check: http://localhost:${config.port}/health`);
  
});

export default app;
