export const APPROVAL_LEVEL = {
    TU_FAKULTAS: 1,
    WAKIL_DEKAN_1: 2,
    DEKAN: 3,
    TU_REKTORAT: 4,
    WAKIL_REKTOR_1: 5,
    REKTOR: 6,
};
export const ROLE_APPROVAL_LEVEL = {
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
export function isFacultyValidator(role) {
    return FACULTY_VALIDATOR_ROLES.includes(role);
}
export function isUniversityValidator(role) {
    return UNIVERSITY_VALIDATOR_ROLES.includes(role);
}
export function getApprovalLevelByRole(role) {
    return ROLE_APPROVAL_LEVEL[role] ?? null;
}
//# sourceMappingURL=approval-level.constant.js.map