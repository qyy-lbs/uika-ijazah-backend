import prisma from "../prisma/prisma.js";
import {
  archiveUniqueValue,
  generateArchiveMarker,
} from "../utils/archive-unique-field.util.js";

type ArchiveType = "RJ" | "RV";

export async function archiveMahasiswaUniqueFields(params: {
  id_mahasiswa: number;
  type: ArchiveType;
}) {
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: {
      id_mahasiswa: params.id_mahasiswa,
    },
    select: {
      id_mahasiswa: true,
      nim: true,
      nik: true,
      pisn: true,
      nomor_seri_ijazah: true,
    },
  });

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan saat archive field unik");
  }

  const marker = generateArchiveMarker(params.type);

  const data: {
    nim?: string;
    nik?: string;
    pisn?: string;
    nomor_seri_ijazah?: string;
  } = {};

  const archivedNim = archiveUniqueValue(mahasiswa.nim, marker);
  if (archivedNim) {
    data.nim = archivedNim;
  }

  const archivedNik = archiveUniqueValue(mahasiswa.nik, marker);
  if (archivedNik) {
    data.nik = archivedNik;
  }

  const archivedPisn = archiveUniqueValue(mahasiswa.pisn, marker);
  if (archivedPisn) {
    data.pisn = archivedPisn;
  }

  const archivedNomorSeriIjazah = archiveUniqueValue(
    mahasiswa.nomor_seri_ijazah,
    marker,
  );

  if (archivedNomorSeriIjazah) {
    data.nomor_seri_ijazah = archivedNomorSeriIjazah;
  }

  if (Object.keys(data).length === 0) {
    return mahasiswa;
  }

  return prisma.mahasiswa.update({
    where: {
      id_mahasiswa: params.id_mahasiswa,
    },
    data,
  });
}