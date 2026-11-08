import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Car } from "./catalog";
import type { ImportedListing } from "./import";
const path = resolve(
  /* turbopackIgnore: true */ process.env.DATABASE_PATH || "data/carfinder.db",
);
mkdirSync(dirname(path), { recursive: true });
const globalDb = globalThis as unknown as { carfinderDb?: DatabaseSync };
export const sqlite = globalDb.carfinderDb ?? new DatabaseSync(path);
globalDb.carfinderDb = sqlite;
sqlite.exec(
  "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
);
type DbCar = Omit<Car, "serviceHistory" | "accidentFree" | "isDemo"> & {
  serviceHistory: number | null;
  accidentFree: number | null;
  isDemo: number;
};
function normalize(row: DbCar): Car {
  return {
    ...row,
    serviceHistory: row.serviceHistory === null ? null : !!row.serviceHistory,
    accidentFree: row.accidentFree === null ? null : !!row.accidentFree,
    isDemo: !!row.isDemo,
  };
}
const fields = [
  "id",
  "fingerprint",
  "brand",
  "model",
  "trim",
  "body",
  "price",
  "mileage",
  "year",
  "fuel",
  "gearbox",
  "power",
  "city",
  "description",
  "serviceHistory",
  "accidentFree",
  "source",
  "externalId",
  "isDemo",
] as const;
type ListingInput = Omit<Car, "id"> & { fingerprint: string };
function insert(
  row: ListingInput,
  id: string = randomUUID(),
  ignoreId = false,
) {
  const data = { id, ...row };
  const values = fields.map((f) =>
    typeof data[f] === "boolean" ? Number(data[f]) : data[f],
  );
  return sqlite
    .prepare(
      `INSERT INTO Listing (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")}) ${ignoreId ? "ON CONFLICT(id) DO NOTHING" : ""}`,
    )
    .run(...values);
}
export const listings = {
  async all(): Promise<Car[]> {
    return (
      sqlite
        .prepare("SELECT * FROM Listing ORDER BY id ASC")
        .all() as unknown as DbCar[]
    ).map(normalize);
  },
  async find(id: string): Promise<Car | null> {
    const row = sqlite
      .prepare("SELECT * FROM Listing WHERE id=?")
      .get(id) as unknown as DbCar | undefined;
    return row ? normalize(row) : null;
  },
  seed(row: ListingInput, id: string) {
    insert(row, id, true);
  },
  import(rows: ImportedListing[]) {
    let added = 0,
      duplicates = 0;
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      for (const row of rows) {
        const exists = sqlite
          .prepare(
            "SELECT id FROM Listing WHERE fingerprint=? OR (source=? AND externalId IS NOT NULL AND externalId=?)",
          )
          .get(row.fingerprint, row.source, row.externalId);
        if (exists) {
          duplicates++;
          continue;
        }
        insert(row);
        added++;
      }
      sqlite.exec("COMMIT");
      return { added, duplicates };
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  },
};
