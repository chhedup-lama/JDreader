import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PrismaClientClass = PrismaClient as any;

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL ?? `file:${path.resolve(process.cwd(), "prisma/applyai.db")}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClientClass({ adapter }) as PrismaClient;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Ensure master profile row always exists (singleton pattern)
export async function ensureProfile() {
  return prisma.masterProfile.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, shortTitle: "", coverLetterInstructions: "" },
    include: {
      workExperiences: { orderBy: { order: "asc" } },
      skills: true,
      leadershipStories: true,
    },
  });
}
