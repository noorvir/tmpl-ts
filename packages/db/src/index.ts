import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.ts";

export { PrismaClient };

export function createPrisma(args: { url: string }) {
  const { url } = args;
  const adapter = new PrismaPg({ connectionString: url });

  return new PrismaClient({ adapter });
}
