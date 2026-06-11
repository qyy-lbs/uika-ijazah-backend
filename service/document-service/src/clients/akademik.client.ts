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
  export async function getAkademikProfileByNim(nim: string,mahasiswaCode?: string) {
  const baseUrl = process.env.AKADEMIK_SERVICE_URL;

  if (!baseUrl) {
    throw new Error("AKADEMIK_SERVICE_URL belum diatur");
  }

  const identifier = mahasiswaCode ?? nim;


  const url = `${baseUrl}/api/akademik/profile/${encodeURIComponent(identifier)}`;

  const result = await fetchJson<AkademikProfileResponse>(url);

  return result.data;
}