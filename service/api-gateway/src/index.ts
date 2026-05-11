import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { verifyGatewayToken } from './middlewares/auth.middleware.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Pastikan OPTIONS diizinkan
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] 
};

// 2. Terapkan middleware CORS global
app.use(cors(corsOptions));
app.options(/./, cors(corsOptions));


// --- PROXY AUTH SERVICE (PINTU PUBLIK - TANPA SATPAM) ---
app.use(createProxyMiddleware({
  pathFilter: '/api/auth', 
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Auth-Service] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));

// --- PROXY INBOUND SERVICE ---

// 1. Satpam mencegat di sini DULU
app.use('/api/inbound', verifyGatewayToken);

// 2. Baru Proxy meneruskan (pakai pathFilter agar Express TIDAK MEMOTONG URL!)
// --- PROXY INBOUND SERVICE ---
app.use(
  '/api/inbound', // Gunakan path dasar tanpa slash di akhir
  verifyGatewayToken, // Satpam jaga di sini
  createProxyMiddleware({
    target: process.env.INBOUND_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/inbound': '', // Gunakan tanda ^ untuk memastikan mencocokkan dari depan
    },
    on: { 
      proxyRes: (proxyRes, req) => {
        console.log(`[Inbound-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
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
    pathRewrite: {
    '/api/dokumen': '',

  },
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
    pathRewrite: {
    '/api/template': '',

  },
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
    pathRewrite: {
    '/api/blockchain': '',

  },
    on: { proxyReq: fixRequestBody }
  })
);

// --- PROXY UNIT (PINTU TERKUNCI - PAKAI SATPAM) ---

// 1. Satpam mencegat di sini DULU
app.use('/api/units', verifyGatewayToken);

// 2. Baru Proxy meneruskan (pakai pathFilter agar URL tidak dipotong!)
app.use(createProxyMiddleware({
  pathFilter: '/api/units', 
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
 
  on: { 
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Unit-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));


// --- PROXY USERS (PINTU TERKUNCI - PAKAI SATPAM) ---

// 1. Satpam mencegat di sini DULU
app.use('/api/users', verifyGatewayToken);

// 2. Baru Proxy meneruskan ke Auth Service (pakai pathFilter agar URL utuh)
app.use(createProxyMiddleware({
  pathFilter: '/api/users', 
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3002', // Arahkan ke Auth Service
  changeOrigin: true,
  on: { 
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Users-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));


app.listen(Number(PORT),'0.0.0.0', () => {
  
  console.log(`🚀 Gateway UIKA ijazah Berhasil di Port ${PORT}`);
  console.log(`🛡️  Middleware Keamanan: AKTIF`);
  console.log("AUTH SERVICE URL:", process.env.AUTH_SERVICE_URL);
});