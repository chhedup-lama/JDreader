import { defineConfig } from "prisma/config";

const isProduction = !!process.env.TURSO_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: isProduction
      ? process.env.TURSO_DATABASE_URL!
      : "file:./prisma/applyai.db",
  },
});
