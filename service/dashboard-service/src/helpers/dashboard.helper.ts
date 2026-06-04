export type DashboardStatus =
  | "terbit"
  | "proses"
  | "rejected"
  | "revoked";

export const mapDashboardStatus = ({
  statusValidasi,
  validated_by,
  hasDokumen,
  hasBlockchain,
}: {
  statusValidasi: string | null;
  validated_by: number | null;
  hasDokumen: boolean;
  hasBlockchain: boolean;
}): DashboardStatus => {
  const status = String(statusValidasi || "")
    .toLowerCase()
    .trim();

  // REJECT
  if (
    status === "rejected" ||
    status === "reject" ||
    status === "ditolak"
  ) {
    return "rejected";
  }

  // REVOKE
  if (
    status === "revoked" ||
    status === "revoke" ||
    status === "dicabut"
  ) {
    return "revoked";
  }

  // TERBIT
  // Kalau dokumen dan blockchain sudah ada, berarti ijazah sudah terbit
  if (
    hasDokumen &&
    hasBlockchain
  ) {
    return "terbit";
  }

  return "proses";
};