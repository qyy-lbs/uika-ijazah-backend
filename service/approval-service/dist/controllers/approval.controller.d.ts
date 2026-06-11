import type { Request, Response } from "express";
type MahasiswaParams = {
    mahasiswaCode: string;
};
type BatchParams = {
    batchCode: string;
};
export declare function getPendingBatches(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getBatchDetail(req: Request<BatchParams>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function approveBatch(req: Request<BatchParams>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function rejectBatch(req: Request<BatchParams>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function revokeMahasiswa(req: Request<MahasiswaParams>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getLaporanApproval(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=approval.controller.d.ts.map