import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { env } from "@acme/config/env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { Prisma } from "@prisma/client";
export { prisma };
