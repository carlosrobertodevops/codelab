// import { PrismaClient } from "@/generated/prisma";
// import { PrismaPg } from "@prisma/adapter-pg";

// declare global {
//   var prisma: PrismaClient | undefined;
// }

// function createPrismaClient() {
//   const connectionString = process.env.DATABASE_URL;
//   if (!connectionString) throw new Error("DATABASE_URL is not set");

//   const adapter = new PrismaPg({ connectionString });
//   return new PrismaClient({ adapter });
// }

// export const prisma = globalThis.prisma ?? createPrismaClient();

// if (process.env.NODE_ENV !== "production") {
//   globalThis.prisma = prisma;
// }
import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL

  // Em produção, falhar cedo é melhor do que erro “misterioso” depois.
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
