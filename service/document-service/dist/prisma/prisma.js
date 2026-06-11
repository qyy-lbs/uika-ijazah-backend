import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur");
}
const pool = new Pool({
    connectionString,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
});
export default prisma;
//# sourceMappingURL=prisma.js.map