import prisma from "./prisma.js";

async function main() {
  const totalTemplate = await prisma.template.count();

  console.log("Koneksi Prisma berhasil.");
  console.log("Jumlah data template:", totalTemplate);
}

main()
  .catch((error) => {
    console.error("Prisma test gagal:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });