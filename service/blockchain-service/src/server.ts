import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3011;

app.listen(PORT, () => {
  console.log(`Blockchain Service berjalan di port ${PORT}`);
});