import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __codelab_prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __codelab_prisma_pool: Pool | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não está definido.");
  }

  const pool =
    global.__codelab_prisma_pool ??
    new Pool({
      connectionString,
    });

  if (process.env.NODE_ENV !== "production") {
    global.__codelab_prisma_pool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = global.__codelab_prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__codelab_prisma = prisma;
}
