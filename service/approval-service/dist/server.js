import "dotenv/config";
import app from "./app.js";
const PORT = process.env.PORT || 3004;
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Approval Service running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map