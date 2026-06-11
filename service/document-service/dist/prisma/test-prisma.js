import prisma from "./prisma.js";
async function main() {
    const totalDokumen = await prisma.dokumen.count();
    console.log("Prisma document-service berhasil terkoneksi.");
    console.log("Total dokumen:", totalDokumen);
}
main()
    .catch((error) => {
    console.error("Prisma test gagal:", error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=test-prisma.js.map