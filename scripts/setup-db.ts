import { readFileSync, readdirSync } from "node:fs";
import { sqlite } from "../lib/db";
sqlite.exec(
  "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, appliedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
);
for (const name of readdirSync("migrations")
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  if (sqlite.prepare("SELECT name FROM _migrations WHERE name=?").get(name))
    continue;
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    sqlite.exec(readFileSync(`migrations/${name}`, "utf8"));
    sqlite.prepare("INSERT INTO _migrations(name) VALUES (?)").run(name);
    sqlite.exec("COMMIT");
    console.log(`Zastosowano migrację ${name}`);
  } catch (e) {
    sqlite.exec("ROLLBACK");
    throw e;
  }
}
