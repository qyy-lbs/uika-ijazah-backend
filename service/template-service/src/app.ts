import express from "express";
import cors from "cors";
import path from "path";
import templateRoutes from "./routes/template.routes.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads/templates",
  express.static(path.join(process.cwd(), "uploads", "templates"))
);

app.use("/api/template", templateRoutes);

export default app;