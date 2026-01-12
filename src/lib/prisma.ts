import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Fail fast in runtime if DB is required and not configured
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({
    connectionString,
    // keep the pool conservative by default (can be tuned later)
    max: Number(process.env.PGPOOL_MAX ?? 10),
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.prismaPool ?? createPool();
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaPool = pool;
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
