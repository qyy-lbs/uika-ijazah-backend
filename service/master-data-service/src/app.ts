import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import unitRoutes from "./routes/unitRoutes.js";
import usersRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

// --- DAFTAR RUTE ---
app.use("/api/unit", unitRoutes);
app.use("/api/user", usersRoutes);
app.use("/api/profile", profileRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "master-data-service" });
});

export default app;