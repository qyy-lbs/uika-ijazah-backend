import {
  getLatestValidationsRepository,
} from "../repositories/dashboard.repository.js";

import {
  mapDashboardStatus,
} from "../helpers/dashboard.helper.js";

export const getSummaryService = async () => {

  const validations =
    await getLatestValidationsRepository() as any[];

  const summary = {
    total_mahasiswa: validations.length,
    proses: 0,
    rejected: 0,
    revoked: 0,
    terbit: 0,
  };

  for (const item of validations) {

    const status = mapDashboardStatus({
      statusValidasi: item.status_validasi,
      validated_by: item.validated_by,
      hasDokumen: !!item.id_dokumen,
      hasBlockchain: !!item.id_blockchain,
    });

    summary[status as keyof typeof summary]++;
  }

  return summary;
};

export const getLatestValidationService = async () => {
  return await getLatestValidationsRepository();
};