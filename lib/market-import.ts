import { mileageWarning } from "./quality";
import { z } from "zod";
import { createHash } from "node:crypto";
const text = z.string().trim().min(1).max(5000);
const n = z.number().int().nonnegative().max(100000000);
const url = z
  .string()
  .max(3000)
  .url()
  .refine((value) => {
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password && !u.port;
    } catch {
      return false;
    }
  }, "Wymagany bezpieczny URL HTTPS bez danych logowania");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Nieprawidłowa data");
const modelSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,100}$/),
    make: text,
    model: text,
    year_from: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    year_to: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    offer_count: n,
    offers_reported_1_to_200000_km: n,
    price_q1_pln: n,
    price_median_pln: n,
    price_q3_pln: n,
    example_engine: text,
    fuel: text,
    scenario_l_per_100km: z.number().nonnegative().max(100),
    annual_fuel_pln: n,
    annual_oil_filters_budget_pln: n,
    annual_fuel_plus_oil_filters_pln: n,
    inspection_points_pl: text,
    price_factors_pl: text,
    technical_sources: z.array(url).max(30),
    fuel_source: url,
  })
  .strict()
  .refine(
    (m) =>
      m.year_from <= m.year_to &&
      m.price_q1_pln <= m.price_median_pln &&
      m.price_median_pln <= m.price_q3_pln,
    "Nieprawidłowy zakres roczników lub kwartyli",
  );
const offerSchema = z
  .object({
    model_id: z.string().max(100),
    id: z.string().regex(/^\d{1,30}$/),
    year: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    asking_price_pln: n.positive(),
    mileage_km: n.max(2000000),
    url: url.refine((s) => {
      try {
        const u = new URL(s);
        return (
          ["www.otomoto.pl", "otomoto.pl"].includes(u.hostname) &&
          /^\/osobowe\/oferta\/[^/]+\.html$/.test(u.pathname) &&
          !u.search &&
          !u.hash
        );
      } catch {
        return false;
      }
    }, "URL musi prowadzić do oferty OTOMOTO"),
  })
  .strict();
const envelope = z
  .object({
    snapshot_date: date,
    market: z.literal("PL"),
    currency: z.literal("PLN"),
    scope_pl: text,
    scenario: z
      .object({
        km_per_year: n,
        pln_per_litre: z.number().nonnegative().max(1000),
        description_pl: text,
        service_source: url,
      })
      .strict(),
    models: z.array(z.unknown()).max(1000),
    offers: z.array(z.unknown()).max(100000),
  })
  .strict();
export type ModelData = z.infer<typeof modelSchema>;
export type MarketOffer = z.infer<typeof offerSchema>;
export type SnapshotMeta = Omit<z.infer<typeof envelope>, "models" | "offers">;
export type ImportIssue = {
  entity: "file" | "model" | "offer";
  index?: number;
  id?: string;
  message: string;
};
export type MarketPlan = {
  meta: SnapshotMeta | null;
  models: ModelData[];
  offers: MarketOffer[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  duplicates: number;
  inputOffers: number;
  fileHash: string;
};
export const MAX_JSON_BYTES = 10 * 1024 * 1024;
export function parseMarketJson(raw: string): MarketPlan {
  const plan: MarketPlan = {
    meta: null,
    models: [],
    offers: [],
    errors: [],
    warnings: [],
    duplicates: 0,
    inputOffers: 0,
    fileHash: createHash("sha256").update(raw).digest("hex"),
  };
  if (Buffer.byteLength(raw) > MAX_JSON_BYTES) {
    plan.errors.push({
      entity: "file",
      message: "Maksymalny rozmiar JSON to 10 MB.",
    });
    return plan;
  }
  let input: unknown;
  try {
    input = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    plan.errors.push({ entity: "file", message: "Nieprawidłowy JSON." });
    return plan;
  }
  const root = envelope.safeParse(input);
  if (!root.success) {
    plan.errors.push({
      entity: "file",
      message: root.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; "),
    });
    return plan;
  }
  const { models, offers, ...meta } = root.data;
  plan.meta = meta;
  plan.inputOffers = offers.length;
  const modelGroups = new Map<string, ModelData[]>();
  models.forEach((value, index) => {
    const r = modelSchema.safeParse(value);
    if (!r.success) {
      plan.errors.push({
        entity: "model",
        index,
        message: r.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      });
      return;
    }
    const group = modelGroups.get(r.data.id) || [];
    group.push(r.data);
    modelGroups.set(r.data.id, group);
  });
  for (const [id, group] of modelGroups) {
    if (group.length > 1) {
      plan.errors.push({
        entity: "model",
        id,
        message: "Powtórzony identyfikator modelu; mapowanie niejednoznaczne.",
      });
    } else plan.models.push(group[0]);
  }
  const byModel = new Map(plan.models.map((m) => [m.id, m]));
  const groups = new Map<string, MarketOffer[]>();
  offers.forEach((value, index) => {
    const r = offerSchema.safeParse(value);
    if (!r.success) {
      plan.errors.push({
        entity: "offer",
        index,
        message: r.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      });
      return;
    }
    const o = r.data,
      m = byModel.get(o.model_id);
    if (!m) {
      plan.errors.push({
        entity: "offer",
        index,
        id: o.id,
        message: "Brak poprawnego, jednoznacznego model_id.",
      });
      return;
    }
    if (o.year < m.year_from || o.year > m.year_to) {
      plan.errors.push({
        entity: "offer",
        index,
        id: o.id,
        message: "Rocznik poza zakresem wskazanego modelu.",
      });
      return;
    }
    const group = groups.get(o.id) || [];
    group.push(o);
    groups.set(o.id, group);
  });
  for (const [id, group] of groups) {
    if (group.some((o) => JSON.stringify(o) !== JSON.stringify(group[0]))) {
      plan.errors.push({
        entity: "offer",
        id,
        message: "Sprzeczne rekordy o tym samym identyfikatorze źródłowym.",
      });
      continue;
    }
    plan.duplicates += group.length - 1;
    plan.offers.push(group[0]);
    const o = group[0],
      warning = mileageWarning(
        o.mileage_km,
        o.year,
        +meta.snapshot_date.slice(0, 4),
      );
    if (warning) plan.warnings.push({ entity: "offer", id, message: warning });
  }
  for (const m of plan.models) {
    const count = plan.offers.filter((o) => o.model_id === m.id).length;
    if (count !== m.offer_count)
      plan.warnings.push({
        entity: "model",
        id: m.id,
        message: `Liczba poprawnych ofert ${count} różni się od deklarowanej ${m.offer_count}.`,
      });
  }
  return plan;
}
