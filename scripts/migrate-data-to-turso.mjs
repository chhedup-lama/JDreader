import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../prisma/applyai.db");

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const local = new Database(dbPath, { readonly: true });

const tables = [
  "MasterProfile",
  "WorkExperience",
  "Skill",
  "LeadershipStory",
  "JobPosting",
  "ApplicationPack",
  "InterviewTracker",
];

for (const table of tables) {
  const rows = local.prepare(`SELECT * FROM "${table}"`).all();
  if (rows.length === 0) {
    console.log(`${table}: empty, skipping`);
    continue;
  }

  for (const row of rows) {
    const cols = Object.keys(row);
    const placeholders = cols.map(() => "?").join(", ");
    const sql = `INSERT OR REPLACE INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`;
    await turso.execute({ sql, args: Object.values(row) });
  }
  console.log(`${table}: migrated ${rows.length} row(s)`);
}

local.close();
console.log("\nDone! All data migrated to Turso.");
