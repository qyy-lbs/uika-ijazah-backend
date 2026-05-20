import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3004;

// Wajib 0.0.0.0 untuk Railway
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ Master Data Service menyala di Port ${PORT}`);
});