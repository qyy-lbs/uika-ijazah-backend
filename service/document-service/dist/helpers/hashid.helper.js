import Hashids from "hashids";
const TYPE_CODE = {
    batch: 1,
    mahasiswa: 2,
    dokumen: 3,
    validasi: 4,
    user: 5,
};
const hashids = new Hashids(process.env.HASHIDS_SALT || "default-secret-salt", Number(process.env.HASHIDS_MIN_LENGTH || 10));
export const encodeId = (type, id) => {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID tidak valid");
    }
    return hashids.encode([TYPE_CODE[type], id]);
};
export const decodeId = (type, code) => {
    const decoded = hashids.decode(code);
    if (!decoded || decoded.length !== 2) {
        throw new Error("Kode URL tidak valid");
    }
    const typeCode = Number(decoded[0]);
    const id = Number(decoded[1]);
    if (typeCode !== TYPE_CODE[type]) {
        throw new Error("Tipe kode URL tidak sesuai");
    }
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID hasil decode tidak valid");
    }
    return id;
};
//# sourceMappingURL=hashid.helper.js.map