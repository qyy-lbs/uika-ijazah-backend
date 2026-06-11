import { findAllBatchesWithMahasiswa } from "../repositories/batch.repository.js";
import { getApprovalLevelByRole, isFacultyValidator, } from "../constants/approval-level.constant.js";
import { VALIDATION_STATUS } from "../constants/status.constant.js";
function hasStatusAtLevel(validasiList, level, status) {
    return validasiList.some((item) => item.level_validasi === level &&
        item.status_validasi?.toLowerCase() === status);
}
function isRevokedOrRejected(validasiList) {
    return validasiList.some((item) => {
        const status = item.status_validasi?.toLowerCase();
        return status === VALIDATION_STATUS.REVOKED || status === VALIDATION_STATUS.REJECTED;
    });
}
function isMahasiswaReadyForLevel(validasiList, currentLevel) {
    if (isRevokedOrRejected(validasiList)) {
        return false;
    }
    const alreadyApprovedCurrentLevel = hasStatusAtLevel(validasiList, currentLevel, VALIDATION_STATUS.APPROVED);
    if (alreadyApprovedCurrentLevel) {
        return false;
    }
    if (currentLevel === 1) {
        return true;
    }
    const previousLevel = currentLevel - 1;
    return hasStatusAtLevel(validasiList, previousLevel, VALIDATION_STATUS.APPROVED);
}
export async function getPendingBatchesForUser(user) {
    const approvalLevel = getApprovalLevelByRole(user.role);
    if (!approvalLevel) {
        throw new Error("Role tidak memiliki level approval");
    }
    const batches = await findAllBatchesWithMahasiswa();
    const filteredBatches = batches
        .map((batch) => {
        let mahasiswa = batch.mahasiswa;
        // Validator fakultas hanya boleh melihat mahasiswa dari fakultasnya sendiri
        if (isFacultyValidator(user.role)) {
            mahasiswa = mahasiswa.filter((mhs) => {
                return mhs.prodi?.id_unit === user.id_unit;
            });
        }
        const mahasiswaPending = mahasiswa.filter((mhs) => isMahasiswaReadyForLevel(mhs.validasi.map((v) => ({
            level_validasi: v.level_validasi,
            status_validasi: v.status_validasi,
        })), approvalLevel));
        if (mahasiswaPending.length === 0) {
            return null;
        }
        const fakultasSet = new Set(mahasiswaPending
            .map((mhs) => mhs.prodi?.unit?.nama_unit)
            .filter(Boolean));
        return {
            batch_code: batch.uuid ?? null,
            nomor_batch_upload: batch.nomor_batch_upload,
            nama_file: batch.nama_file,
            periode: batch.periode,
            tahun_lulus: batch.tahun_lulus,
            total_record: batch.total_record,
            created_at: batch.created_at,
            approval_level: approvalLevel,
            pending_count: mahasiswaPending.length,
            fakultas: Array.from(fakultasSet),
            mahasiswa: mahasiswaPending.map((mhs) => ({
                id_mahasiswa: mhs.id_mahasiswa,
                nim: mhs.nim,
                nama_mahasiswa: mhs.nama_mahasiswa,
                program_studi: mhs.prodi?.nama_prodi,
                fakultas: mhs.prodi?.unit?.nama_unit,
                tahun_lulus: mhs.tahun_lulus,
            })),
        };
    })
        .filter(Boolean);
    return filteredBatches;
}
//# sourceMappingURL=pending-batch.service.js.map