export declare const APPROVAL_LEVEL: {
    readonly TU_FAKULTAS: 1;
    readonly WAKIL_DEKAN_1: 2;
    readonly DEKAN: 3;
    readonly TU_REKTORAT: 4;
    readonly WAKIL_REKTOR_1: 5;
    readonly REKTOR: 6;
};
export declare const ROLE_APPROVAL_LEVEL: Record<string, number>;
export declare const FACULTY_VALIDATOR_ROLES: string[];
export declare const UNIVERSITY_VALIDATOR_ROLES: string[];
export declare function isFacultyValidator(role: string): boolean;
export declare function isUniversityValidator(role: string): boolean;
export declare function getApprovalLevelByRole(role: string): number | null;
//# sourceMappingURL=approval-level.constant.d.ts.map