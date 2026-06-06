import express from "express";
import cors from "cors";
import path from "path";
import qrRoutes from "./routes/qr.routes.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads/qr",
  express.static(path.join(process.cwd(), "uploads", "qr"))
);

app.use("/api/qr", qrRoutes);

export default app;