import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// --- PROXY AUTH SERVICE ---
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

// --- PROXY INBOUND SERVICE ---
app.use(createProxyMiddleware({
  pathFilter: '/api/inbound',
  target: process.env.INBOUND_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 Gateway UIKA Berhasil di Port ${PORT}`);
});