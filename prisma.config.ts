import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7+: URLs de conexão para Migrate/CLI saem do schema.prisma
// e passam a viver aqui.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
