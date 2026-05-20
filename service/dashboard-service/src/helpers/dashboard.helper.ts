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
}) => {

  if (statusValidasi === "ditolak") {
    return "rejected";
  }
  
  if (
      statusValidasi === "dicabut"
    ) {
        return "revoked";
    }
    
    if (
      hasDokumen &&
      hasBlockchain
    ) {
      return "terbit";
    }

  return "proses";
};