import express from "express";
import cors from "cors";
import morgan from "morgan";
import approvalRoutes from "./routes/approval.routes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/approval", approvalRoutes);
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Approval Service is running",
    });
});
export default app;
//# sourceMappingURL=app.js.map