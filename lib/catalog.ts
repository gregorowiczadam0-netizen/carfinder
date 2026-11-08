export const BRANDS = ["BMW", "Mercedes", "Jaguar", "Volvo"] as const;
export const BODIES = [
  "Sedan",
  "Kombi",
  "SUV",
  "Coupé",
  "Hatchback",
  "Kabriolet",
] as const;
export const FUELS = [
  "Benzyna",
  "Diesel",
  "Hybryda",
  "Elektryczny",
  "LPG",
] as const;
export const GEARBOXES = ["Manualna", "Automatyczna"] as const;
export const brandKey = (brand: string) =>
  brand === "Mercedes-Benz" ? "Mercedes" : brand;
export const sourceLabel = (car: Car) =>
  car.isDemo
    ? "FIKCYJNA OFERTA"
    : car.source === "otomoto"
      ? "OTOMOTO · SNAPSHOT"
      : "IMPORT CSV · NIEZWERYFIKOWANA";
export const money = (n: number) =>
  new Intl.NumberFormat("pl-PL").format(n) + " zł";
export const number = (n: number) => new Intl.NumberFormat("pl-PL").format(n);
export type Car = {
  id: string;
  brand: string;
  model: string;
  trim: string;
  body: string | null;
  price: number;
  mileage: number;
  year: number;
  fuel: string | null;
  gearbox: string | null;
  power: number | null;
  city: string | null;
  description: string;
  serviceHistory: boolean | null;
  accidentFree: boolean | null;
  source: string;
  externalId: string | null;
  isDemo: boolean;
  engine?: string | null;
  sourceUrl?: string | null;
  snapshotDate?: string | null;
  modelProfileId?: string | null;
};
export type Filters = {
  brands: string[];
  model: string;
  body: string;
  minPrice: string;
  maxPrice: string;
  maxMileage: string;
  minYear: string;
  maxYear: string;
  fuel: string;
  gearbox: string;
  query: string;
};
export const defaultFilters: Filters = {
  brands: [...BRANDS],
  model: "",
  body: "",
  minPrice: "10000",
  maxPrice: "20000",
  maxMileage: "200000",
  minYear: "",
  maxYear: "",
  fuel: "",
  gearbox: "",
  query: "",
};
export function filterCars(cars: Car[], f: Filters) {
  return cars.filter(
    (c) =>
      (!f.brands.length || f.brands.includes(brandKey(c.brand))) &&
      (!f.model || c.model === f.model) &&
      (!f.body || c.body === f.body) &&
      (!f.minPrice || c.price >= +f.minPrice) &&
      (!f.maxPrice || c.price <= +f.maxPrice) &&
      (!f.maxMileage || c.mileage <= +f.maxMileage) &&
      (!f.minYear || c.year >= +f.minYear) &&
      (!f.maxYear || c.year <= +f.maxYear) &&
      (!f.fuel || c.fuel === f.fuel) &&
      (!f.gearbox || c.gearbox === f.gearbox) &&
      `${c.brand} ${c.model} ${c.trim} ${c.city ?? ""}`
        .toLocaleLowerCase("pl")
        .includes(f.query.trim().toLocaleLowerCase("pl")),
  );
}
