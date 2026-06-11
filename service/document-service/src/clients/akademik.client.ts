import { fetchJson } from "../utils/http-client.util.js";

type AkademikProfileResponse = {
  success: boolean;
  message: string;
  data: {
    mahasiswa: Record<string, unknown>;
    akademik: Record<string, unknown>;
    pejabat?: Record<string, unknown>;
    assets?: Record<string, unknown>;
    dokumen_placeholder?: Record<string, unknown>;
    batch?: Record<string, unknown>;
    approval?: Record<string, unknown>;
    transkrip: unknown[];
  };
};

export async function getAkademikProfileByMahasiswaCode(
  mahasiswaCode: string,
) {
  const baseUrl = process.env.AKADEMIK_SERVICE_URL;

  if (!baseUrl) {
    throw new Error("AKADEMIK_SERVICE_URL belum diatur");
  }

  const url = `${baseUrl}/api/akademik/profile/${encodeURIComponent(
    mahasiswaCode,
  )}`;

  const result = await fetchJson<AkademikProfileResponse>(url);

  return result.data;
}

/**
 * Alias sementara supaya kode lama yang masih import getAkademikProfileByNim
 * tetap berjalan. Endpoint akademik sekarang menerima NIM maupun UUID mahasiswa.
 */
export const getAkademikProfileByNim = getAkademikProfileByMahasiswaCode;
