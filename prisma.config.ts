import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Importante para Docker build: durante o build nem sempre o DATABASE_URL existe.
    // Mantemos um fallback seguro para permitir `prisma generate`.
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@db:5432/postgres?schema=public",
  },
});
