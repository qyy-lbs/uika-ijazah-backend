import express from "express";
import cors from "cors";
import akademikRoutes from "./routes/akademik.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/akademik", akademikRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Akademik Service is running",
  });
});

export default app;