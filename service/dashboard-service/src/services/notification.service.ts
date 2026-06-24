import {
  findRejectRevokeNotificationsRepository,
  type NotificationUser,
} from "../repositories/notification.repository.js";

const ROLES_WITH_NOTIFICATION = [
  "operator",
  "operator_data",
  "tu_fakultas",
  "wakil_dekan_1",
  "wakil_dekan",
  "dekan",
  "tu_rektorat",
  "wakil_rektor_1",
  "wakil_rektor",
  "rektor",
];

function formatRole(role?: string | null) {
  const normalized = String(role || "")
    .toLowerCase()
    .trim();

  const labels: Record<string, string> = {
    operator: "Operator",
    operator_data: "Operator",
    tu_fakultas: "TU Fakultas",
    wakil_dekan_1: "Wakil Dekan",
    wakil_dekan: "Wakil Dekan",
    dekan: "Dekan",
    tu_rektorat: "TU Rektorat",
    wakil_rektor_1: "Wakil Rektor",
    wakil_rektor: "Wakil Rektor",
    rektor: "Rektor",
  };

  return labels[normalized] || normalized || "User";
}

function formatTime(value?: Date | string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function cleanNotificationMessage(message?: string | null) {
  return String(message || "")
    .replace(/\s*pada\s+level\s+\d+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapNotification(item: any) {
  const aktivitas = String(item.aktivitas || "").toUpperCase();
  const isReject = aktivitas === "REJECT_BATCH";
  const isRevoke = aktivitas === "REVOKE_MAHASISWA";

  const actorRole = formatRole(item.users?.role);
  const actorUnit = item.users?.unit?.nama_unit || null;

  return {
    id_log: item.id_log,
    type: isReject ? "reject" : isRevoke ? "revoke" : "activity",
    aktivitas,
    title: isReject
      ? "Data ditolak"
      : isRevoke
        ? "Data direvoke"
        : "Aktivitas terbaru",
    message: cleanNotificationMessage(
  item.deskripsi ||
    `${actorRole}${actorUnit ? ` ${actorUnit}` : ""} melakukan ${aktivitas}`,
),
    actor_role: actorRole,
    actor_unit: actorUnit,
    created_at: item.created_at,
    time_label: formatTime(item.created_at),
  };
}

export async function getRejectRevokeNotificationsService(
  user: NotificationUser,
  limit = 5,
) {
  const role = String(user.role || "")
    .toLowerCase()
    .trim();

  if (!ROLES_WITH_NOTIFICATION.includes(role)) {
    return [];
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);

  const rows = await findRejectRevokeNotificationsRepository(
    user,
    safeLimit,
  );

  return rows.map(mapNotification);
}