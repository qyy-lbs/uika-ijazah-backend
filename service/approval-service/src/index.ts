import 'dotenv/config'; // <-- Tambahkan baris ini paling atas
import express, { Express } from 'express';
import approvalRoutes from './routes/approval.routes.js'; // Ekstensi .js wajib di ESM

const app: Express = express();

app.use(express.json());

// Daftarkan rute API
app.use('/api/approval', approvalRoutes);

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`🚀 Approval Service (TypeScript) berhasil berjalan di port ${PORT}`);
});