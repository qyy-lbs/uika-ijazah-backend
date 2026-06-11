export const mapDashboardStatus = ({ statusValidasi, hasVerifiedDocument, }) => {
    const status = String(statusValidasi || "")
        .toLowerCase()
        .trim();
    if (status === "rejected" || status === "reject" || status === "ditolak") {
        return "rejected";
    }
    if (status === "revoked" || status === "revoke" || status === "dicabut") {
        return "revoked";
    }
    if (hasVerifiedDocument) {
        return "terbit";
    }
    return "proses";
};
//# sourceMappingURL=dashboard.helper.js.map