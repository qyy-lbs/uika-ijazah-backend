import "dotenv/config";
import pkg from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
declare const prisma: pkg.PrismaClient<{
    adapter: PrismaPg;
}, never, import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map