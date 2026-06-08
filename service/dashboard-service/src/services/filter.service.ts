import {
  getFacultiesRepository,
  getYearsRepository,
} from "../repositories/filter.repository.js";

export const getFacultiesService = async () => {
  const rows = await getFacultiesRepository();

  return (rows as any[]).map((item) => ({
    id_unit: item.id_unit,
    fakultas: item.fakultas,
    nama_unit: item.fakultas,
  }));
};

export const getYearsService = async () => {
  const rows = await getYearsRepository();

  return (rows as any[]).map((item) => ({
    tahun_lulus: Number(item.tahun_lulus),
    tahun: Number(item.tahun_lulus),
  }));
};