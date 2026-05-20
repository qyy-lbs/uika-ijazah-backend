import app from "./app.js";

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`Dashboard Service running on port ${PORT}`);
});