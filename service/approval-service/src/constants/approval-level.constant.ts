export const APPROVAL_LEVEL = {
  TU_FAKULTAS: 1,
  WAKIL_DEKAN_1: 2,
  DEKAN: 3,
  TU_REKTORAT: 4,
  WAKIL_REKTOR_1: 5,
  REKTOR: 6,
} as const;

export const ROLE_APPROVAL_LEVEL: Record<string, number> = {
  tu_fakultas: APPROVAL_LEVEL.TU_FAKULTAS,
  wakil_dekan_1: APPROVAL_LEVEL.WAKIL_DEKAN_1,
  dekan: APPROVAL_LEVEL.DEKAN,
  tu_rektorat: APPROVAL_LEVEL.TU_REKTORAT,
  wakil_rektor_1: APPROVAL_LEVEL.WAKIL_REKTOR_1,
  rektor: APPROVAL_LEVEL.REKTOR,
};

export const FACULTY_VALIDATOR_ROLES = [
  "tu_fakultas",
  "wakil_dekan_1",
  "dekan",
];

export const UNIVERSITY_VALIDATOR_ROLES = [
  "tu_rektorat",
  "wakil_rektor_1",
  "rektor",
];
export function canViewAllLaporan(role: string) {
  return [
    "operator",
    "tu_rektorat",
    "warek_1",
    "rektor",
  ].includes(role);
}
export function isFacultyValidator(role: string): boolean {
  return FACULTY_VALIDATOR_ROLES.includes(role);
}

export function isUniversityValidator(role: string): boolean {
  return UNIVERSITY_VALIDATOR_ROLES.includes(role);
}

export function getApprovalLevelByRole(role: string): number | null {
  return ROLE_APPROVAL_LEVEL[role] ?? null;
}