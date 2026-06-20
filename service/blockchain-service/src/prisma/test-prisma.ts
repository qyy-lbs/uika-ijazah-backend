import prisma from "./prisma.js";

async function main() {
  const totalDokumen = await prisma.dokumen.count();
  const totalBlockchain = await prisma.blockchain.count();

  console.log("Koneksi database OK");
  console.log("Total dokumen:", totalDokumen);
  console.log("Total blockchain:", totalBlockchain);
}

main()
  .catch((error) => {
    console.error("Prisma error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });