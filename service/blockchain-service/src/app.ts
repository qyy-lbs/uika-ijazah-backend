import express from "express";
import cors from "cors";
import blockchainRoutes from "./routes/blockchain.routes.js";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/blockchain", blockchainRoutes);

export default app;