import { describe, it, expect } from "vitest";
import { parseImport, fingerprint } from "../lib/import";
import { scoreCar } from "../lib/score";
import { filterCars, defaultFilters, type Car } from "../lib/catalog";
const car: Car = {
  id: "a",
  brand: "BMW",
  model: "Seria 3",
  trim: "320i",
  body: "Sedan",
  price: 15000,
  mileage: 180000,
  year: 2010,
  fuel: "Benzyna",
  gearbox: "Manualna",
  power: 150,
  city: "Warszawa",
  description: "Oferta",
  serviceHistory: true,
  accidentFree: null,
  source: "demo",
  externalId: null,
  isDemo: true,
};
const csv =
  'brand,model,body,price,mileage,year,fuel,gearbox,city,description,isDemo\nBMW,Seria 3,Sedan,15000,180000,2010,Benzyna,Manualna,Warszawa,"Oferta, testowa",true';
describe("CSV", () => {
  it("parsuje UTF-8 z BOM, cytowane przecinki i braki danych", () => {
    const r = parseImport("\uFEFF" + csv);
    expect(r.errors).toEqual([]);
    expect(r.rows[0]).toMatchObject({
      description: "Oferta, testowa",
      power: null,
      accidentFree: null,
      isDemo: true,
    });
  });
  it("odrzuca cały plik z niepoprawną liczbą i kategorią", () => {
    const r = parseImport(
      csv.replace("15000", "-5").replace("Manualna", "Nieznana"),
    );
    expect(r.errors[0]).toContain("Wiersz 2");
  });
  it("odrzuca brak wymaganych nagłówków oraz pusty plik", () => {
    expect(parseImport("brand,model\nBMW,3").errors.length).toBeGreaterThan(0);
    expect(parseImport("").errors.length).toBeGreaterThan(0);
  });
  it("obsługuje średnik i null dla nieznanej historii", () => {
    expect(
      parseImport(
        csv
          .replaceAll(",", ";")
          .replace('"Oferta; testowa"', '"Oferta testowa"'),
      ).rows[0].serviceHistory,
    ).toBeNull();
  });
  it("nie traktuje false jako true", () => {
    const r = parseImport(
      csv
        .replace("isDemo", "isDemo,accidentFree")
        .replace('testowa",true', 'testowa",false,false'),
    );
    expect(r.rows[0].isDemo).toBe(false);
    expect(r.rows[0].accidentFree).toBe(false);
  });
  it("normalizuje fingerprint bez rozróżnienia wielkości liter", () => {
    expect(fingerprint(car)).toBe(
      fingerprint({ ...car, brand: " bmw ", city: "WARSZAWA" }),
    );
    expect(fingerprint(car)).not.toBe(fingerprint({ ...car, isDemo: false }));
  });
  it("odrzuca ponad 500 wierszy", () => {
    const [header, row] = csv.split("\n");
    expect(
      parseImport(header + "\n" + Array(501).fill(row).join("\n")).errors,
    ).toContain("Maksymalnie 500 wierszy na import.");
  });
});
describe("ocena", () => {
  it("nie udaje wyceny bez próby; brak danych daje 0 pkt", () => {
    const r = scoreCar(car, [car], 2026);
    expect(r.median).toBeNull();
    expect(r.criteria[0].points).toBe(0);
    expect(r.missing.length).toBe(2);
  });
  it("wyklucza siebie, dane rzeczywiste, inny model i paliwo", () => {
    const peers = Array.from({ length: 3 }, (_, i) => ({
      ...car,
      id: String(i),
      price: 20000 + i * 1000,
    }));
    const r = scoreCar(
      car,
      [
        car,
        ...peers,
        { ...car, id: "real", isDemo: false, price: 1000 },
        { ...car, id: "other", fuel: "Diesel", price: 1000 },
      ],
      2026,
    );
    expect(r.median).toBe(21000);
    expect(r.peerCount).toBe(3);
    expect(r.discount).toBe(29);
    expect(r.total).toBeGreaterThan(
      scoreCar({ ...car, price: 40000 }, peers, 2026).total,
    );
  });
  it("wynik pozostaje 0–100 nawet dla skrajnych wartości", () => {
    for (const mileage of [0, 300000, 2000000]) {
      const r = scoreCar({ ...car, mileage }, [car], 2026);
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(r.total).toBeLessThanOrEqual(100);
    }
  });
});
describe("filtry", () => {
  it("stosuje domyślny zakres i marki", () => {
    expect(
      filterCars(
        [
          car,
          { ...car, id: "b", price: 21000 },
          { ...car, id: "c", mileage: 200001 },
          { ...car, id: "d", brand: "Audi" },
        ],
        defaultFilters,
      ),
    ).toHaveLength(1);
  });
  it("łączy model, nadwozie, lata, paliwo, skrzynię i wyszukiwanie", () => {
    expect(
      filterCars([car], {
        ...defaultFilters,
        query: "WARSZAWA",
        minYear: "2009",
        maxYear: "2011",
        model: "Seria 3",
        body: "Sedan",
        fuel: "Benzyna",
        gearbox: "Manualna",
      }),
    ).toHaveLength(1);
    expect(
      filterCars([car], { ...defaultFilters, fuel: "Diesel" }),
    ).toHaveLength(0);
  });
});
