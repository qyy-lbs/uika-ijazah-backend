import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { verifyGatewayToken } from './middlewares/auth.middleware.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// cors diubah sementara gara gara zullllllllllll salah url!!!!!!......
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Pastikan OPTIONS diizinkan
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] 
};
app.use(cors(corsOptions));
app.options(/./, cors(corsOptions));
// zulllll salah urll


// ==========================================================
// 1. PROXY AUTH SERVICE (PINTU PUBLIK - TANPA SATPAM)
// ==========================================================
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


// ==========================================================
// 2. PROXY SERVIS LAINNYA (PAKAI PATH REWRITE)
// ==========================================================

// --- PROXY INBOUND SERVICE (Port 3003) ---
app.use(
  '/api/inbound', 
  verifyGatewayToken, 
  createProxyMiddleware({
    target: process.env.INBOUND_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/inbound': '', 
    },
    on: { 
      proxyRes: (proxyRes, req) => {
        console.log(`[Inbound-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
      }
    }
  })
);

// --- PROXY DOKUMEN SERVICE (Port 3007) ---
app.use(
  '/api/dokumen', 
  verifyGatewayToken, 
  createProxyMiddleware({
    target: process.env.DOKUMEN_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    pathRewrite: {
    '/api/dokumen': '',
  },
    on: { proxyReq: fixRequestBody }
  })
);

// --- PROXY TEMPLATE SERVICE (Port 3008) ---
app.use(
  '/api/template', 
  verifyGatewayToken, 
  createProxyMiddleware({
    target: process.env.TEMPLATE_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    pathRewrite: {
    '/api/template': '',
  },
    on: { proxyReq: fixRequestBody }
  })
);

// --- PROXY BLOCKCHAIN SERVICE (Port 3009) ---
app.use(
  '/api/blockchain', 
  verifyGatewayToken, 
  createProxyMiddleware({
    target: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    pathRewrite: {
    '/api/blockchain': '',
  },
    on: { proxyReq: fixRequestBody }
  })
);


// ==========================================================
// 3. PROXY MASTER DATA SERVICE (PORT 3004 - PINTU TERKUNCI)
// ==========================================================

// --- PROXY UNITS ---
app.use('/api/units', verifyGatewayToken);
app.use(createProxyMiddleware({
  pathFilter: '/api/units', 
  target: process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  on: { 
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Unit-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));

// --- PROXY USERS ---
app.use('/api/users', verifyGatewayToken);
app.use(createProxyMiddleware({
  pathFilter: '/api/users', 
  target: process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:3004', 
  changeOrigin: true,
  on: { 
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Users-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));

// --- PROXY PROFILE ---
app.use('/api/profile', verifyGatewayToken);
app.use(createProxyMiddleware({
  pathFilter: '/api/profile', 
  target: process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:3004', 
  changeOrigin: true,
  on: { 
    proxyReq: fixRequestBody,
    proxyRes: (proxyRes, req) => {
      console.log(`[Profile-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    }
  }
}));


app.use(
  "/api/akademik", 
  verifyGatewayToken, // ✅ Memanggil nama satpam yang benar!
  createProxyMiddleware({
    // URL target disesuaikan dengan brankas .env
    target: process.env.AKADEMIK_SERVICE_URL || "http://akademik-service.railway.internal:3005", 
    changeOrigin: true,
    // Baris logLevel dihapus agar TypeScript tenang
  })
);


// ==========================================================
// --- START SERVER ---
// ==========================================================
app.listen(Number(PORT),'0.0.0.0', () => {
  console.log(`🚀 Gateway UIKA Ijazah Berhasil di Port ${PORT}`);
  console.log(`🛡️  Middleware Keamanan: AKTIF`);
  console.log(`🔑 Auth Target: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`🗄️  Master Data Target: ${process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:3004'}`);
});