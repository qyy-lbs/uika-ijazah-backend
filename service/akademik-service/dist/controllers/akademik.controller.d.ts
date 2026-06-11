import type { Request, Response } from "express";
type MahasiswaParams = {
    mahasiswaCode: string;
};
export declare function getProfile(req: Request<MahasiswaParams>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getTranskrip(req: Request<MahasiswaParams>, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getValidasiAkademik(req: Request<MahasiswaParams>, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=akademik.controller.d.ts.map