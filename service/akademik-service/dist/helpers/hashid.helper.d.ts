type HashIdType = "batch" | "mahasiswa" | "dokumen" | "validasi" | "user";
export declare const encodeId: (type: HashIdType, id: number) => string;
export declare const decodeId: (type: HashIdType, code: string) => number;
export {};
//# sourceMappingURL=hashid.helper.d.ts.map