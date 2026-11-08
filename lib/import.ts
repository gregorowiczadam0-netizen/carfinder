import Papa from "papaparse";
import { z } from "zod";
import { createHash } from "node:crypto";
import { BODIES, FUELS, GEARBOXES } from "./catalog";
const text = z.string().trim().min(1).max(100);
const integer = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Wymagana liczba całkowita")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));
const optionalBool = z
  .enum(["true", "false", ""])
  .optional()
  .transform((v) => (v === "true" ? true : v === "false" ? false : null));
const schema = z.object({
  brand: text,
  model: text,
  trim: z.string().trim().max(100).optional().default(""),
  body: z.enum(BODIES),
  price: integer(1, 10000000),
  mileage: integer(0, 2000000),
  year: integer(1900, new Date().getFullYear() + 1),
  fuel: z.enum(FUELS),
  gearbox: z.enum(GEARBOXES),
  power: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null)
    .pipe(z.union([z.null(), integer(1, 3000)])),
  city: text,
  description: z.string().trim().min(1).max(5000),
  serviceHistory: optionalBool,
  accidentFree: optionalBool,
  externalId: z
    .string()
    .trim()
    .max(150)
    .optional()
    .transform((v) => v || null),
  isDemo: z.enum(["true", "false"]).transform((v) => v === "true"),
});
export type ImportedListing = z.infer<typeof schema> & {
  source: string;
  fingerprint: string;
};
export const requiredHeaders = [
  "brand",
  "model",
  "body",
  "price",
  "mileage",
  "year",
  "fuel",
  "gearbox",
  "city",
  "description",
  "isDemo",
];
export function fingerprint(c: {
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  city: string | null;
  isDemo: boolean;
}) {
  return createHash("sha256")
    .update(
      [c.brand, c.model, c.year, c.price, c.mileage, c.city, c.isDemo]
        .map((v) => String(v).normalize("NFKC").trim().toLocaleLowerCase("pl"))
        .join("|"),
    )
    .digest("hex");
}
export function parseImport(csv: string) {
  const parsed = Papa.parse<Record<string, string>>(
    csv.replace(/^\uFEFF/, ""),
    {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    },
  );
  const errors: string[] = [];
  for (const e of parsed.errors)
    errors.push(
      `CSV${e.row !== undefined ? ` · wiersz ${e.row + 2}` : ""}: ${e.message}`,
    );
  for (const h of requiredHeaders)
    if (!parsed.meta.fields?.includes(h)) errors.push(`Brak kolumny: ${h}`);
  if (parsed.data.length > 500)
    errors.push("Maksymalnie 500 wierszy na import.");
  if (!parsed.data.length) errors.push("Plik nie zawiera ofert.");
  if (errors.length) return { rows: [] as ImportedListing[], errors };
  const rows: ImportedListing[] = [];
  parsed.data.forEach((raw, i) => {
    const result = schema.safeParse(raw);
    if (!result.success) {
      errors.push(
        `Wiersz ${i + 2}: ${result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
      );
      return;
    }
    const data = result.data;
    rows.push({ ...data, source: "csv", fingerprint: fingerprint(data) });
  });
  return { rows, errors };
}
