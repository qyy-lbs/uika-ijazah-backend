import express from "express";
import cors from "cors";
import path from "path";
import documentRoutes from "./routes/document.routes.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads/documents",
  express.static(path.join(process.cwd(), "uploads", "documents"))
);

app.use("/api/document", documentRoutes);

export default app;