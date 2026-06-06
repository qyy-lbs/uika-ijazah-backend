import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3009;

app.listen(PORT, () => {
  console.log(`Document Service berjalan di port ${PORT}`);
});