import prisma from "../prisma/prisma.js";
import { findMatkulByProdiId } from "../repositories/akademik.repository.js";
import { findNilaiByMahasiswaId } from "../repositories/transkrip.repository.js";
import { getDummyGrade } from "../utils/nilai-dummy.util.js";

export async function generateNilaiDummyIfNeeded(data: {
  id_mahasiswa: number;
  id_prodi: number | null;
}) {
  const { id_mahasiswa, id_prodi } = data;

  if (!id_prodi) {
    throw new Error("Mahasiswa belum memiliki prodi");
  }

  const matkulList = await findMatkulByProdiId(id_prodi);

  if (matkulList.length === 0) {
    throw new Error("Mata kuliah untuk prodi mahasiswa belum tersedia");
  }

  const existingNilai = await findNilaiByMahasiswaId(id_mahasiswa);

  const existingAkademikIds = new Set(
    existingNilai
      .map((item) => item.id_akademik)
      .filter((id): id is number => id !== null)
  );

  const nilaiToCreate = matkulList
    .filter((matkul) => !existingAkademikIds.has(matkul.id_akademik))
    .map((matkul, index) => {
      const grade = getDummyGrade(index);

      return {
        id_mahasiswa,
        id_akademik: matkul.id_akademik,
        nilai_huruf: grade.nilai_huruf,
        nilai_angka: grade.nilai_angka,
        bobot_t: null,
      };
    });

  if (nilaiToCreate.length === 0) {
    return {
      generated: false,
      total_generated: 0,
    };
  }

  await prisma.nilai.createMany({
    data: nilaiToCreate,
    skipDuplicates: true,
  });

  return {
    generated: true,
    total_generated: nilaiToCreate.length,
  };
}