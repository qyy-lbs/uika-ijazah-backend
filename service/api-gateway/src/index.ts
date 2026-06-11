import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { verifyGatewayToken } from "./middlewares/auth.middleware.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://103.158.196.32:5173", // kalau frontend dideploy di server
    "http://103.158.196.32:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Pastikan OPTIONS diizinkan
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-internal-service-key",
  ],
};
app.use(cors(corsOptions));
app.options(/./, cors(corsOptions));
// zulllll salah urll

// ==========================================================
// 1. PROXY AUTH SERVICE (PINTU PUBLIK - TANPA SATPAM)
// ==========================================================
app.use(
  createProxyMiddleware({
    pathFilter: "/api/auth",
    target: process.env.AUTH_SERVICE_URL || "http://localhost:3002",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Auth-Service] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// ==========================================================
// 2. PROXY SERVIS LAINNYA (PAKAI PATH REWRITE)
// ==========================================================

// --- PROXY INBOUND SERVICE (Port 3003) ---
app.use("/api/inbound", verifyGatewayToken);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/inbound",
    target: process.env.INBOUND_SERVICE_URL || "http://localhost:3003",
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        const contentType = req.headers["content-type"] || "";

        if (!contentType.includes("multipart/form-data")) {
          fixRequestBody(proxyReq, req);
        }
      },
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Inbound-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);




// ==========================================================
// 3. PROXY MASTER DATA SERVICE (PORT 3004 - PINTU TERKUNCI)
// ==========================================================

// --- PROXY UNITS ---
app.use("/api/unit", verifyGatewayToken);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/unit",
    target: process.env.MASTER_DATA_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Unit-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// --- PROXY USERS ---
app.use("/api/user", verifyGatewayToken);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/user",
    target: process.env.MASTER_DATA_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Users-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// --- PROXY PROFILE ---
app.use("/api/profile", verifyGatewayToken);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/profile",
    target: process.env.MASTER_DATA_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Profile-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// --- PROXY AKADEMIK SERVICE ---
app.use("/api/akademik", verifyGatewayToken);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/akademik",
    target: process.env.AKADEMIK_SERVICE_URL || "http://localhost:3005",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Akademik-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// --- PROXY APPROVAL SERVICE ---
app.use("/api/approval", verifyGatewayToken);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/approval",
    target: process.env.APPROVAL_SERVICE_URL || "http://localhost:3006",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Approval-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);
// --- PROXY Template SERVICE ---
app.use("/api/template", verifyGatewayToken);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/template",
    target: process.env.TEMPLATE_SERVICE_URL || "http://localhost:3008",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Template-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// --- PROXY Template Uploads ---
app.use(
  createProxyMiddleware({
    pathFilter: "/uploads/templates",
    target: process.env.TEMPLATE_SERVICE_URL || "http://localhost:3008",
    changeOrigin: true,
    on: {
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Template-Uploads] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// --- PROXY DASHBOARD SERVICE (Port 3007) ---
app.use("/api/dashboard", verifyGatewayToken);
app.use(
  createProxyMiddleware({
    pathFilter: "/api/dashboard",
    target: process.env.DASHBOARD_SERVICE_URL || "http://localhost:3007",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[dashboard-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);



// ==========================================================
// PROXY DOCUMENT SERVICE
// ==========================================================

// PUBLIC VERIFY DOCUMENT
app.use(
  createProxyMiddleware({
    pathFilter: "/api/document/verify",
    target: process.env.DOCUMENT_SERVICE_URL || "http://localhost:3009",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Document-Verify] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// PROTECTED DOCUMENT ROUTES
app.use("/api/document", verifyGatewayToken);

app.use(
  createProxyMiddleware({
    pathFilter: "/api/document",
    target: process.env.DOCUMENT_SERVICE_URL || "http://localhost:3009",
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Document-Route] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// DOCUMENT FILES
app.use(
  createProxyMiddleware({
    pathFilter: "/uploads/documents",
    target: process.env.DOCUMENT_SERVICE_URL || "http://localhost:3009",
    changeOrigin: true,
    on: {
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Document-Uploads] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);

// ==========================================================
// PROXY QR SERVICE
// ==========================================================

// QR FILES
app.use(
  createProxyMiddleware({
    pathFilter: "/uploads/qr",
    target: process.env.QR_SERVICE_URL || "http://localhost:3010",
    changeOrigin: true,
    on: {
      proxyRes: (proxyRes, req) => {
        console.log(
          `[Qr-Uploads] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`,
        );
      },
    },
  }),
);
// ==========================================================
// --- START SERVER ---
// ==========================================================
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Gateway UIKA Ijazah Berhasil di Port ${PORT}`);
  console.log(`🛡️  Middleware Keamanan: AKTIF`);
  console.log(
    `🔑 Auth Target: ${process.env.AUTH_SERVICE_URL || "http://localhost:3002"}`,
  );
  console.log(
    `📥 Inbound Target: ${process.env.INBOUND_SERVICE_URL || "http://localhost:3003"}`,
  );
  console.log(
    `🗄️  Master Data Target: ${process.env.MASTER_DATA_SERVICE_URL || "http://localhost:3004"}`,
  );
  console.log(
    `🎓 Akademik Target: ${process.env.AKADEMIK_SERVICE_URL || "http://localhost:3005"}`,
  );
  console.log(
    `✅ Approval Target: ${process.env.APPROVAL_SERVICE_URL || "http://localhost:3006"}`,
  );
  console.log(
    `📊 Dashboard Target: ${process.env.DASHBOARD_SERVICE_URL || "http://localhost:3007"}`,
  );
  console.log(
    `📋 Template Target: ${process.env.TEMPLATE_SERVICE_URL || "http://localhost:3008"}`,
  );
});
