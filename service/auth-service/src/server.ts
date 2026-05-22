import app from './app.js';

const PORT = process.env.PORT || 3002;

// Jalankan Server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Auth Service berjalan di http://localhost:${PORT}`);
});