import { PrismaClient } from "@prisma/client";

import { env } from "@acme/config/env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { Prisma } from "@prisma/client";
export { prisma };
