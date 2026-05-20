import express from "express";
import batchRoutes
from "./routes/batch.routes.js";


import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();
app.use(express.json());

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard/batches",
batchRoutes);

export default app;