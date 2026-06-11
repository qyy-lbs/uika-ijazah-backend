import type { NextFunction, Request, Response } from "express";
export declare function verifyApprovalRole(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function verifyReportAccess(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=approval-role.middleware.d.ts.map