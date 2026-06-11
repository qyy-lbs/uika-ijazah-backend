import prisma from "./prisma.js";
async function main() {
    const totalBatch = await prisma.batch_upload.count();
    const totalMahasiswa = await prisma.mahasiswa.count();
    const totalValidasi = await prisma.validasi.count();
    console.log("Total batch:", totalBatch);
    console.log("Total mahasiswa:", totalMahasiswa);
    console.log("Total validasi:", totalValidasi);
}
main()
    .catch((error) => {
    console.error("Prisma error:", error);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=test-prisma.js.map