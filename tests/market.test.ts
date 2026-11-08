import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseMarketJson } from "../lib/market-import";
import { scoreCar } from "../lib/score";
import { filterCars, defaultFilters } from "../lib/catalog";
const raw = readFileSync("datasets/carfinder-rynek-pl.json", "utf8");
const dataset = JSON.parse(raw);
const dir = mkdtempSync(join(tmpdir(), "carfinder-market-"));
process.env.DATABASE_PATH = join(dir, "test.db");
let db: typeof import("../lib/db");
let market: typeof import("../lib/market-db");
beforeAll(async () => {
  db = await import("../lib/db");
  db.sqlite.exec(readFileSync("migrations/001_init.sql", "utf8"));
  db.sqlite.exec(
    "INSERT INTO Listing(id,fingerprint,brand,model,body,price,mileage,year,fuel,gearbox,city,description,source,isDemo) VALUES ('demo-legacy','legacy','BMW','Seria 3','Sedan',15000,180000,2008,'Diesel','Manualna','Warszawa','Demo','demo',1)",
  );
  db.sqlite.exec(readFileSync("migrations/002_market_snapshot.sql", "utf8"));
  market = await import("../lib/market-db");
});
afterAll(() => {
  db.sqlite.close();
  rmSync(dir, { recursive: true });
});
describe("walidacja snapshotu", () => {
  it("odczytuje wszystkie 787 ofert, 8 modeli i 6 ostrzeżeń bez błędów", () => {
    const p = parseMarketJson(raw);
    expect(p.offers).toHaveLength(787);
    expect(p.models).toHaveLength(8);
    expect(p.errors).toEqual([]);
    expect(p.warnings).toHaveLength(6);
  });
  it("odrzuca uszkodzony JSON, zły typ daty, nierealną datę i walutę", () => {
    for (const input of [
      "{",
      JSON.stringify({ ...dataset, snapshot_date: "2026-02-30" }),
      JSON.stringify({ ...dataset, currency: "EUR" }),
    ])
      expect(parseMarketJson(input).meta).toBeNull();
  });
  it("importuje poprawne wiersze mimo braku modelu, ujemnej ceny, złych URL i nadmiarowych pól innych wierszy", () => {
    const good = dataset.offers[0];
    const p = parseMarketJson(
      JSON.stringify({
        ...dataset,
        offers: [
          good,
          { ...good, id: "2", model_id: "absent" },
          { ...good, id: "3", asking_price_pln: -1 },
          { ...good, id: "4", url: "javascript:alert(1)" },
          {
            ...good,
            id: "5",
            url: "https://www.otomoto.pl.evil.example/osobowe/oferta/a.html",
          },
          { ...good, id: "6", fuel: "ON" },
          { ...good, id: "7", url: "nie-jest-adresem" },
        ],
      }),
    );
    expect(p.offers).toHaveLength(1);
    expect(p.errors).toHaveLength(6);
  });
  it("nie wybiera arbitralnie modelu lub oferty przy sprzecznych identyfikatorach", () => {
    expect(
      parseMarketJson(
        JSON.stringify({
          ...dataset,
          models: [dataset.models[0], dataset.models[0]],
          offers: [dataset.offers[0]],
        }),
      ).offers,
    ).toHaveLength(0);
    const o = dataset.offers[0];
    const p = parseMarketJson(
      JSON.stringify({
        ...dataset,
        offers: [o, { ...o, asking_price_pln: 17001 }],
      }),
    );
    expect(p.offers).toHaveLength(0);
    expect(p.errors[0].message).toContain("Sprzeczne");
  });
  it("deduplikuje identyczne wiersze w pliku po ID", () => {
    const o = dataset.offers[0];
    const p = parseMarketJson(JSON.stringify({ ...dataset, offers: [o, o] }));
    expect(p.offers).toHaveLength(1);
    expect(p.duplicates).toBe(1);
  });
});
it("zachowuje stare dane, mapuje modele, zapisuje URL i snapshot, nie wymyśla cech", async () => {
  const legacy = await db.listings.find("demo-legacy");
  expect(legacy).toMatchObject({
    isDemo: true,
    city: "Warszawa",
    fuel: "Diesel",
    mileage: 180000,
  });
  const report = market.importMarketJson(raw);
  expect(report).toMatchObject({
    added: 787,
    saved: 787,
    modelCount: 8,
    errors: [],
  });
  const car = await db.listings.find("otomoto-6151080158");
  expect(car).toMatchObject({
    brand: "BMW",
    model: "Seria 3",
    externalId: "6151080158",
    year: 2009,
    price: 13000,
    mileage: 337719,
    sourceUrl: dataset.offers[0].url,
    snapshotDate: "2026-11-08",
    body: null,
    fuel: null,
    gearbox: null,
    engine: null,
    city: null,
    serviceHistory: null,
    accidentFree: null,
    isDemo: false,
  });
  const profile = market.modelProfile(car!.modelProfileId);
  expect(profile?.model.example_engine).toBe("320d N47");
  expect(car?.fuel).toBeNull();
  expect((await db.listings.all()).filter((c) => !c.isDemo)).toHaveLength(787);
  expect(
    filterCars(await db.listings.all(), defaultFilters).filter(
      (c) => !c.isDemo,
    ),
  ).toHaveLength(107);
  expect(
    filterCars(await db.listings.all(), {
      ...defaultFilters,
      fuel: "Diesel",
    }).filter((c) => !c.isDemo),
  ).toHaveLength(0);
});
it("powtórzenie nie zmienia liczby ofert i nie scala różnych źródłowych ID o tych samych cechach", async () => {
  const report = market.importMarketJson(raw);
  expect(report).toMatchObject({
    added: 0,
    updated: 0,
    unchanged: 787,
    saved: 787,
  });
  const o = dataset.offers[0];
  const r = market.importMarketJson(
    JSON.stringify({
      ...dataset,
      offers: [
        { ...o, id: "9000000001" },
        { ...o, id: "9000000002" },
      ],
    }),
  );
  expect(r.added).toBe(2);
  expect((await db.listings.all()).filter((c) => !c.isDemo)).toHaveLength(789);
});
it("aktualizuje nowszy snapshot bez zmiany ID oraz nie nadpisuje go starszym", async () => {
  const o = dataset.offers[0];
  const newer = JSON.stringify({
    ...dataset,
    snapshot_date: "2026-11-09",
    offers: [{ ...o, asking_price_pln: 14000 }],
  });
  expect(market.importMarketJson(newer).updated).toBe(1);
  const car = await db.listings.find("otomoto-" + o.id);
  expect(car?.price).toBe(14000);
  expect(market.importMarketJson(raw).older).toBe(1);
  expect((await db.listings.find(car!.id))?.snapshotDate).toBe("2026-11-09");
});
it("błąd zapisu wycofuje całą transakcję wraz z metadanymi snapshotu", () => {
  db.sqlite.exec(
    "CREATE TRIGGER fail_market BEFORE INSERT ON Listing WHEN NEW.externalId='99999999' BEGIN SELECT RAISE(ABORT,'test'); END",
  );
  const o = dataset.offers[0];
  const json = JSON.stringify({
    ...dataset,
    snapshot_date: "2026-11-10",
    offers: [
      { ...o, id: "99999998" },
      { ...o, id: "99999999" },
    ],
  });
  expect(() => market.importMarketJson(json)).toThrow();
  expect(
    db.sqlite
      .prepare("SELECT id FROM Listing WHERE externalId='99999998'")
      .get(),
  ).toBeUndefined();
  expect(
    db.sqlite
      .prepare("SELECT id FROM MarketSnapshot WHERE snapshotDate='2026-11-10'")
      .get(),
  ).toBeUndefined();
  db.sqlite.exec("DROP TRIGGER fail_market");
});
it("brak cech i podejrzany przebieg nie dają wysokich punktów nawet przy niskiej cenie", async () => {
  const cars = await db.listings.all();
  const car = cars.find((c) => c.externalId === "6151183959")!;
  const score = scoreCar({ ...car, price: 1 }, cars, 2026);
  expect(score.total).toBeLessThanOrEqual(30);
  expect(score.criteria[1].points).toBe(0);
  expect(score.warnings[0]).toContain("Przebieg do sprawdzenia");
  expect(score.median).toBeNull();
  expect(score.missing.length).toBeGreaterThan(4);
});
