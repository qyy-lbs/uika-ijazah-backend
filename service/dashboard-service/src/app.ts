import express from "express";
import cors from "cors";

import dashboardRoutes from "./routes/dashboard.routes.js";
import batchRoutes from "./routes/batch.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard", batchRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dashboard Service is running",
  });
});

export default app;