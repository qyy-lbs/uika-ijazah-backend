import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

// 1. IMPORT SATPAM KITA DI SINI
import { verifyGatewayToken } from './middlewares/auth.middleware';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*",
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
})); //mengizinkan semua domain untuk binding

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

// --- PROXY DOKUMEN SERVICE (Port 3005) ---
app.use(
  '/api/dokumen', 
  verifyGatewayToken, 
  createProxyMiddleware({
    target: process.env.DOKUMEN_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    on: { proxyReq: fixRequestBody }
  })
);

// --- PROXY TEMPLATE SERVICE (Port 3006) ---
app.use(
  '/api/template', 
  verifyGatewayToken, 
  createProxyMiddleware({
    target: process.env.TEMPLATE_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    on: { proxyReq: fixRequestBody }
  })
);

// --- PROXY BLOCKCHAIN SERVICE (Port 3007) ---
app.use(
  '/api/blockchain', 
  verifyGatewayToken, 
  createProxyMiddleware({
    target: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    on: { proxyReq: fixRequestBody }
  })
);

// --- PROXY UNIT (PINTU TERKUNCI - PAKAI SATPAM) ---

// 1. Satpam mencegat di sini DULU
app.use('/api/unit', verifyGatewayToken);

// 2. Baru Proxy meneruskan (pakai pathFilter agar URL tidak dipotong!)
app.use(createProxyMiddleware({
  pathFilter: '/api/unit', 
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  on: { 
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Unit-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 Gateway UIKA Berhasil di Port ${PORT}`);
  console.log(`🛡️  Middleware Keamanan: AKTIF`);
});