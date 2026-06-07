export type DashboardStatus =
  | "terbit"
  | "proses"
  | "rejected"
  | "revoked";

export const mapDashboardStatus = ({
  statusValidasi,
  hasVerifiedDocument,
}: {
  statusValidasi: string | null;
  hasVerifiedDocument: boolean;
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
  // Diambil dari dokumen ijazah yang sudah verified
  if (hasVerifiedDocument) {
    return "terbit";
  }

  return "proses";
};