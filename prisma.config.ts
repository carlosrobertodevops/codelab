import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7+:
 * - A URL do banco sai do schema.prisma e vai para este arquivo.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
