import prisma from "./prisma.js";
async function main() {
    const totalBatch = await prisma.batch_upload.count();
    console.log("Total batch:", totalBatch);
}
main()
    .catch((error) => {
    console.error("Prisma error:", error);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=test-prisma.js.map