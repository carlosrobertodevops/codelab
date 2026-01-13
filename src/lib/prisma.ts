import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
   
  var __prisma: PrismaClient | undefined;
   
  var __prismaPool: Pool | undefined;
}

/**
 * Prisma 7 usa Adapter para conexão direta (ex.: Postgres via `pg`).
 * Isso evita o erro pedindo `adapter` ou `accelerateUrl`.
 */
function getPool() {
  if (!global.__prismaPool) {
    global.__prismaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return global.__prismaPool;
}

function createPrismaClient() {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
