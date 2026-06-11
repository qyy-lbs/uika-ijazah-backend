export declare function createLogAktivitas(data: {
    id_user: number;
    aktivitas: string;
    deskripsi: string;
}): Promise<{
    uuid: string | null;
    created_at: Date | null;
    id_log: number;
    id_user: number | null;
    aktivitas: string | null;
    deskripsi: string | null;
}>;
//# sourceMappingURL=log.repository.d.ts.map