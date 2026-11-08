import { beforeAll, afterAll, it, expect } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseImport } from "../lib/import";
const dir = mkdtempSync(join(tmpdir(), "carfinder-test-"));
process.env.DATABASE_PATH = join(dir, "test.db");
let repository: typeof import("../lib/db");
beforeAll(async () => {
  repository = await import("../lib/db");
  repository.sqlite.exec(readFileSync("migrations/001_init.sql", "utf8"));
});
afterAll(() => {
  repository.sqlite.close();
  rmSync(dir, { recursive: true });
});
it("zapisuje, deduplikuje po treści i externalId oraz wycofuje błędną transakcję", async () => {
  const parsed = parseImport(readFileSync("public/przyklad.csv", "utf8"));
  expect(parsed.errors).toEqual([]);
  const row = parsed.rows[0];
  expect(repository.listings.import([row, row])).toEqual({
    added: 1,
    duplicates: 1,
  });
  expect(
    repository.listings.import([
      { ...row, price: 20000, fingerprint: "other" },
    ]),
  ).toEqual({ added: 0, duplicates: 1 });
  const stored = await repository.listings.all();
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    isDemo: true,
    accidentFree: null,
    serviceHistory: true,
  });
  expect(await repository.listings.find(stored[0].id)).not.toBeNull();
  expect(() =>
    repository.listings.import([
      { ...row, externalId: "new", fingerprint: "new" },
      { ...row, price: -1, externalId: "bad", fingerprint: "bad" },
    ]),
  ).toThrow();
  expect(await repository.listings.all()).toHaveLength(1);
});
