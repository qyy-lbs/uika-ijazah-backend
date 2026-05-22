import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Rute Tes (Untuk cek koneksi dari Gateway)
app.get('/api/dokumen/test', (req, res) => {
    res.json({
        status: "success",
        message: "Markas Dokumen Service (Port 3005) Siap Menerima File!"
    });
});

app.listen(PORT, () => {
    console.log(`📄 Dokumen Service Berjalan di Port ${PORT}`);
});