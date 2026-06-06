import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  console.log(`QR Service berjalan di port ${PORT}`);
});