import prisma from "./prisma.js";
async function main() {
    const totalMahasiswa = await prisma.mahasiswa.count();
    console.log("Total mahasiswa:", totalMahasiswa);
}
main()
    .catch((error) => {
    console.error("Prisma error:", error);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=test-prisma.js.map