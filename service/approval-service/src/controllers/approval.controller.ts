import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Konstanta Level Pejabat
const LEVEL = {
  REKTOR: 1,
  WAKIL_REKTOR: 2,
  TU_REKTORAT: 3,
  DEKAN: 4,
  WAKIL_DEKAN: 5,
  TU_FAKULTAS: 6
};

// ==========================================
// 1. APPROVE DOKUMEN (SATUAN)
// ==========================================
export const approveData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_mahasiswa, id_user } = req.body;

    const user = await prisma.users.findUnique({ 
      where: { id_user: Number(id_user) },
      select: { id_user: true, role: true, id_unit: true }
    });

    const mhs = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa: Number(id_mahasiswa) },
      include: { prodi: true }
    });

    if (!user || !mhs) {
      res.status(404).json({ status: "error", message: "User atau Mahasiswa tidak ditemukan." }); return;
    }

    const userRole = user.role ? user.role.toUpperCase() : "UNKNOWN";
    const current_level = LEVEL[userRole as keyof typeof LEVEL];

    if (current_level === undefined) {
      res.status(403).json({ status: "error", message: `Role tidak dikenali.` }); return;
    }

    // --- GEMBOK FAKULTAS ---
    if (current_level >= 4 && user.id_unit !== mhs.prodi?.id_unit) {
      res.status(403).json({ status: "error", message: "Aksi ditolak! Mahasiswa ini bukan dari Fakultas Anda." }); return;
    }

    // --- GEMBOK ESTAFET ---
    const sudahNaikLevel = await prisma.validasi.findFirst({
      where: { id_mahasiswa: Number(id_mahasiswa), level_validasi: { lt: current_level } }
    });
    if (sudahNaikLevel) {
      res.status(400).json({ status: "error", message: `Terkunci! Sudah diproses oleh Level ${sudahNaikLevel.level_validasi}.` }); return;
    }

    // --- GEMBOK GILIRAN ---
    if (current_level < 6) {
      const levelSebelumnya = current_level + 1;
      const cekValidasiSebelumnya = await prisma.validasi.findFirst({
        where: { id_mahasiswa: Number(id_mahasiswa), level_validasi: levelSebelumnya, status_validasi: 'APPROVED' }
      });
      if (!cekValidasiSebelumnya) {
        res.status(400).json({ status: "error", message: `Belum disetujui oleh Level ${levelSebelumnya}.` }); return;
      }
    }

    const validasi = await prisma.$transaction(async (tx) => {
      const existingData = await tx.validasi.findFirst({
        where: { id_mahasiswa: Number(id_mahasiswa), level_validasi: current_level }
      });

      if (existingData && existingData.status_validasi === 'APPROVED') {
        throw new Error("Dokumen sudah di-approve di level ini.");
      }

      if (existingData) {
        return await tx.validasi.update({
          where: { id_validasi: existingData.id_validasi },
          data: { status_validasi: 'APPROVED', validated_by: Number(id_user), catatan: "Approved", validated_at: new Date() }
        });
      } else {
        return await tx.validasi.create({
          data: { id_mahasiswa: Number(id_mahasiswa), validated_by: Number(id_user), status_validasi: 'APPROVED', level_validasi: current_level, catatan: "Approved", validated_at: new Date() }
        });
      }
    });

    if (current_level === 1) console.log(`[TRIGGER] Membentuk PDF & Hashing Blockchain untuk ID: ${id_mahasiswa}`);
    res.status(200).json({ status: "success", message: `Berhasil di-approve oleh ${userRole}.`, data: validasi });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ==========================================
// 2. BULK APPROVE (MASSAL PER BATCH - MAX 10)
// ==========================================
export const bulkApproveData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_mahasiswa_list, id_user } = req.body;

    if (!Array.isArray(id_mahasiswa_list) || id_mahasiswa_list.length === 0) {
      res.status(400).json({ status: "error", message: "Harap kirimkan array id_mahasiswa_list." }); return;
    }

    // KAK: Batasan Maksimal 10 Data per Batch
    if (id_mahasiswa_list.length > 10) {
      res.status(400).json({ status: "error", message: "Maksimal 10 data per proses (Sesuai SOP QC)." }); return;
    }

    const user = await prisma.users.findUnique({ where: { id_user: Number(id_user) } });
    if (!user) { res.status(404).json({ status: "error", message: "User tidak ditemukan." }); return; }
    
    const userRole = user.role ? user.role.toUpperCase() : "UNKNOWN";
    const current_level = LEVEL[userRole as keyof typeof LEVEL];

    const berhasil: number[] = [];
    const gagal: any[] = [];

    for (const id_mhs of id_mahasiswa_list) {
      try {
        const mhs = await prisma.mahasiswa.findUnique({
          where: { id_mahasiswa: Number(id_mhs) },
          include: { prodi: true }
        });

        if (!mhs) throw new Error("Mahasiswa tidak ditemukan.");

        if (current_level >= 4 && user.id_unit !== mhs.prodi?.id_unit) throw new Error("Bukan dari Fakultas Anda.");

        const sudahNaikLevel = await prisma.validasi.findFirst({
          where: { id_mahasiswa: Number(id_mhs), level_validasi: { lt: current_level } }
        });
        if (sudahNaikLevel) throw new Error(`Terkunci Level ${sudahNaikLevel.level_validasi}.`);

        if (current_level < 6) {
          const levelSebelumnya = current_level + 1;
          const cek = await prisma.validasi.findFirst({
            where: { id_mahasiswa: Number(id_mhs), level_validasi: levelSebelumnya, status_validasi: 'APPROVED' }
          });
          if (!cek) throw new Error(`Belum di-approve Level ${levelSebelumnya}.`);
        }

        const existingData = await prisma.validasi.findFirst({
          where: { id_mahasiswa: Number(id_mhs), level_validasi: current_level }
        });

        if (existingData) {
            await prisma.validasi.update({
                where: { id_validasi: existingData.id_validasi },
                data: { status_validasi: "APPROVED", validated_by: Number(id_user), catatan: "Approved (Batch)", validated_at: new Date() }
            });
        } else {
            await prisma.validasi.create({
                data: { id_mahasiswa: Number(id_mhs), validated_by: Number(id_user), status_validasi: "APPROVED", level_validasi: current_level, catatan: "Approved (Batch)", validated_at: new Date() }
            });
        }

        if (current_level === 1) console.log(`[TRIGGER] Blockchain ID: ${id_mhs}`);
        berhasil.push(Number(id_mhs)); 
      } catch (err: any) {
        gagal.push({ id_mahasiswa: id_mhs, alasan: err.message });
      }
    }

    const status = berhasil.length === 0 ? "failed" : (gagal.length > 0 ? "partial_success" : "success");
    res.status(status === "failed" ? 400 : (status === "partial_success" ? 207 : 200)).json({ status, message: "Proses selesai.", data: { berhasil, gagal } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ==========================================
// 3. REJECT BATCH (TOLAK MASSAL - MAX 10)
// ==========================================
export const rejectData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_mahasiswa_list, id_user, alasan_reject } = req.body;

    // KAK: Alasan Tolak Wajib
    if (!alasan_reject || alasan_reject.trim() === "") {
      res.status(400).json({ status: "error", message: "Alasan penolakan batch wajib diisi." }); return;
    }

    if (!Array.isArray(id_mahasiswa_list) || id_mahasiswa_list.length === 0) {
      res.status(400).json({ status: "error", message: "Harap kirimkan array id_mahasiswa_list." }); return;
    }

    // KAK: Batasan Maksimal 10 Data per Batch
    if (id_mahasiswa_list.length > 10) {
      res.status(400).json({ status: "error", message: "Maksimal 10 data per proses (Sesuai SOP QC)." }); return;
    }

    const user = await prisma.users.findUnique({ where: { id_user: Number(id_user) } });
    if (!user) { res.status(404).json({ status: "error", message: "User tidak ditemukan." }); return; }
    
    const userRole = user.role ? user.role.toUpperCase() : "UNKNOWN";
    const current_level = LEVEL[userRole as keyof typeof LEVEL];

    const berhasil: number[] = [];
    const gagal: any[] = [];

    for (const id_mhs of id_mahasiswa_list) {
      try {
        const mhs = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: Number(id_mhs) }, include: { prodi: true } });
        if (!mhs) throw new Error("Tidak ditemukan.");

        if (current_level >= 4 && user.id_unit !== mhs.prodi?.id_unit) throw new Error("Bukan Fakultas Anda.");

        const sudahNaik = await prisma.validasi.findFirst({ where: { id_mahasiswa: Number(id_mhs), level_validasi: { lt: current_level } } });
        if (sudahNaik) throw new Error(`Sudah diproses Level ${sudahNaik.level_validasi}.`);

        const existingData = await prisma.validasi.findFirst({
          where: { id_mahasiswa: Number(id_mhs), level_validasi: current_level }
        });

        if (existingData) {
            await prisma.validasi.update({
                where: { id_validasi: existingData.id_validasi },
                data: { status_validasi: "REJECTED", validated_by: Number(id_user), catatan: `Batch Rejected: ${alasan_reject}`, validated_at: new Date() }
            });
        } else {
            await prisma.validasi.create({
                data: { id_mahasiswa: Number(id_mhs), validated_by: Number(id_user), status_validasi: "REJECTED", level_validasi: current_level, catatan: `Batch Rejected: ${alasan_reject}`, validated_at: new Date() }
            });
        }

        berhasil.push(Number(id_mhs));
      } catch (err: any) {
        gagal.push({ id_mahasiswa: id_mhs, alasan: err.message });
      }
    }

    const status = berhasil.length === 0 ? "failed" : (gagal.length > 0 ? "partial_success" : "success");
    res.status(status === "failed" ? 400 : 200).json({ status, message: "Proses Reject Batch selesai.", data: { berhasil, gagal } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ==========================================
// 4. REVOKE DATA (REJECT INDIVIDU DARI BATCH)
// ==========================================
export const revokeData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_mahasiswa, id_user, alasan_revoke } = req.body;

    // KAK: Alasan Revoke Wajib
    if (!alasan_revoke || alasan_revoke.trim() === "") {
      res.status(400).json({ status: "error", message: "Alasan revoke (pengeluaran dari batch) wajib diisi." }); return;
    }

    const user = await prisma.users.findUnique({ where: { id_user: Number(id_user) } });
    const mhs = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: Number(id_mahasiswa) }, include: { prodi: true } });
    
    if (!user || !mhs) { res.status(404).json({ status: "error", message: "Data tidak lengkap." }); return; }
    
    const userRole = user.role ? user.role.toUpperCase() : "UNKNOWN";
    const current_level = LEVEL[userRole as keyof typeof LEVEL];

    if (current_level >= 4 && user.id_unit !== mhs.prodi?.id_unit) {
      res.status(403).json({ status: "error", message: "Bukan Fakultas Anda." }); return;
    }

    const sudahNaik = await prisma.validasi.findFirst({ where: { id_mahasiswa: Number(id_mahasiswa), level_validasi: { lt: current_level } } });
    if (sudahNaik) { res.status(400).json({ status: "error", message: "Terkunci level atas." }); return; }

    const existingData = await prisma.validasi.findFirst({
      where: { id_mahasiswa: Number(id_mahasiswa), level_validasi: current_level }
    });

    if (existingData) {
        await prisma.validasi.update({
            where: { id_validasi: existingData.id_validasi },
            data: { status_validasi: "REJECTED", validated_by: Number(id_user), catatan: `Revoked: ${alasan_revoke}`, validated_at: new Date() }
        });
    } else {
        await prisma.validasi.create({
            data: { id_mahasiswa: Number(id_mahasiswa), validated_by: Number(id_user), status_validasi: "REJECTED", level_validasi: current_level, catatan: `Revoked: ${alasan_revoke}`, validated_at: new Date() }
        });
    }

    res.status(200).json({ status: "success", message: "Mahasiswa berhasil di-revoke dari batch." });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ==========================================
// 5. REVISI & RIWAYAT (ADMIN / OPERATOR RESET)
// ==========================================
export const revisiData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_mahasiswa } = req.body;
    const cek = await prisma.validasi.findFirst({ where: { id_mahasiswa: Number(id_mahasiswa), status_validasi: "REJECTED" } });
    if (!cek) { res.status(400).json({ status: "error", message: "Tidak dalam status ditolak." }); return; }
    
    await prisma.validasi.deleteMany({ where: { id_mahasiswa: Number(id_mahasiswa) } });
    res.status(200).json({ status: "success", message: "Revisi berhasil (History validasi dihapus)." });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const bulkRevisiData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_mahasiswa_list } = req.body; 
    if (!Array.isArray(id_mahasiswa_list) || id_mahasiswa_list.length === 0) {
      res.status(400).json({ status: "error", message: "Harap kirimkan array id_mahasiswa_list." }); return;
    }

    const berhasil: number[] = [];
    const gagal: any[] = [];

    for (const id_mhs of id_mahasiswa_list) {
      try {
        const cekReject = await prisma.validasi.findFirst({ where: { id_mahasiswa: Number(id_mhs), status_validasi: "REJECTED" } });
        if (!cekReject) throw new Error("Dokumen tidak dalam status ditolak (REJECTED).");

        await prisma.validasi.deleteMany({ where: { id_mahasiswa: Number(id_mhs) } });
        berhasil.push(Number(id_mhs));
      } catch (err: any) {
        gagal.push({ id_mahasiswa: id_mhs, alasan: err.message });
      }
    }

    const status = berhasil.length === 0 ? "failed" : (gagal.length > 0 ? "partial_success" : "success");
    res.status(status === "failed" ? 400 : 200).json({ status, message: "Semua data berhasil direvisi.", data: { berhasil, gagal } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getRiwayatApproval = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_mahasiswa } = req.params;
    const riwayat = await prisma.validasi.findMany({ where: { id_mahasiswa: Number(id_mahasiswa) }, orderBy: { level_validasi: 'desc' } });
    if (riwayat.length === 0) { res.status(404).json({ status: "error", message: "Belum ada riwayat." }); return; }
    res.status(200).json({ status: "success", data: riwayat });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};