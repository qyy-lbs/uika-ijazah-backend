import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

// 1. IMPORT SATPAM KITA DI SINI
import { verifyGatewayToken } from './middlewares/auth.middleware';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); //mengizinkan semua domain untuk binding

// --- PROXY AUTH SERVICE (PINTU PUBLIK - TANPA SATPAM) ---
app.use(createProxyMiddleware({
  pathFilter: '/api/auth', // Menangkap semua yang berawal /api/auth
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Auth-Service] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));

// --- PROXY INBOUND SERVICE (PINTU TERKUNCI - PAKAI SATPAM) ---
// 2. KITA PASANG SATPAM DI RUTE INI
app.use(
  '/api/inbound', 
  verifyGatewayToken, // <--- Satpam mencegat di sini sebelum diteruskan ke Inbound
  createProxyMiddleware({
    // pathFilter tidak perlu lagi karena sudah ditangkap oleh app.use('/api/inbound')
    target: process.env.INBOUND_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(`[Inbound-Service] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
      }
    }
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Gateway UIKA Berhasil di Port ${PORT}`);
  console.log(`🛡️  Middleware Keamanan: AKTIF`);
});