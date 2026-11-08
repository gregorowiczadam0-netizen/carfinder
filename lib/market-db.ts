import { sqlite } from "./db";
import {
  parseMarketJson,
  type ModelData,
  type SnapshotMeta,
} from "./market-import";
export function modelProfile(
  id: string | null | undefined,
): { model: ModelData; meta: SnapshotMeta } | null {
  if (!id) return null;
  const row = sqlite
    .prepare(
      "SELECT m.data,s.snapshotDate,s.market,s.currency,s.scope,s.scenario FROM ModelProfile m JOIN MarketSnapshot s ON s.id=m.snapshotId WHERE m.id=?",
    )
    .get(id);
  if (!row) return null;
  return {
    model: JSON.parse(String(row.data)),
    meta: {
      snapshot_date: String(row.snapshotDate),
      market: "PL",
      currency: "PLN",
      scope_pl: String(row.scope),
      scenario: JSON.parse(String(row.scenario)),
    },
  };
}
export function importMarketJson(raw: string) {
  const plan = parseMarketJson(raw);
  let added = 0,
    updated = 0,
    unchanged = plan.duplicates,
    older = 0;
  if (!plan.meta)
    return {
      snapshot: null,
      fileHash: plan.fileHash,
      inputOffers: plan.inputOffers,
      validOffers: 0,
      modelCount: 0,
      added,
      updated,
      unchanged,
      older,
      saved: 0,
      duplicatesInFile: 0,
      rejected: plan.inputOffers,
      errors: plan.errors,
      warnings: plan.warnings,
    };
  const meta = plan.meta,
    snapshotId = `otomoto:${meta.snapshot_date}`;
  const byModel = new Map(plan.models.map((m) => [m.id, m]));
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    sqlite
      .prepare(
        "INSERT INTO MarketSnapshot(id,snapshotDate,market,currency,scope,scenario,fileHash) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET scope=excluded.scope,scenario=excluded.scenario,fileHash=excluded.fileHash",
      )
      .run(
        snapshotId,
        meta.snapshot_date,
        meta.market,
        meta.currency,
        meta.scope_pl,
        JSON.stringify(meta.scenario),
        plan.fileHash,
      );
    for (const m of plan.models)
      sqlite
        .prepare(
          "INSERT INTO ModelProfile(id,sourceModelId,snapshotId,brand,model,data) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET brand=excluded.brand,model=excluded.model,data=excluded.data",
        )
        .run(
          `${snapshotId}:${m.id}`,
          m.id,
          snapshotId,
          m.make,
          m.model,
          JSON.stringify(m),
        );
    for (const o of plan.offers) {
      const m = byModel.get(o.model_id)!;
      const profileId = `${snapshotId}:${m.id}`;
      const existing = sqlite
        .prepare(
          "SELECT * FROM Listing WHERE source='otomoto' AND externalId=?",
        )
        .get(o.id);
      if (existing && String(existing.snapshotDate) > meta.snapshot_date) {
        older++;
        plan.warnings.push({
          entity: "offer",
          id: o.id,
          message: "Starszy snapshot pominięty; zachowano nowsze dane w bazie.",
        });
        continue;
      }
      if (
        existing &&
        existing.snapshotDate === meta.snapshot_date &&
        existing.price === o.asking_price_pln &&
        existing.mileage === o.mileage_km &&
        existing.year === o.year &&
        existing.sourceUrl === o.url &&
        existing.modelProfileId === profileId &&
        existing.brand === m.make &&
        existing.model === m.model
      ) {
        unchanged++;
        continue;
      }
      if (existing) {
        sqlite
          .prepare(
            "UPDATE Listing SET brand=?,model=?,price=?,mileage=?,year=?,sourceUrl=?,snapshotDate=?,modelProfileId=? WHERE id=?",
          )
          .run(
            m.make,
            m.model,
            o.asking_price_pln,
            o.mileage_km,
            o.year,
            o.url,
            meta.snapshot_date,
            profileId,
            existing.id,
          );
        updated++;
      } else {
        sqlite
          .prepare(
            "INSERT INTO Listing(id,fingerprint,brand,model,price,mileage,year,description,source,externalId,isDemo,sourceUrl,snapshotDate,modelProfileId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          )
          .run(
            `otomoto-${o.id}`,
            `otomoto:${o.id}`,
            m.make,
            m.model,
            o.asking_price_pln,
            o.mileage_km,
            o.year,
            "Dane z pliku snapshotu dostarczonego przez użytkownika. Aktywność ogłoszenia i stan pojazdu nie zostały zweryfikowane.",
            "otomoto",
            o.id,
            0,
            o.url,
            meta.snapshot_date,
            profileId,
          );
        added++;
      }
    }
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }
  return {
    snapshot: meta.snapshot_date,
    fileHash: plan.fileHash,
    inputOffers: plan.inputOffers,
    validOffers: plan.offers.length,
    modelCount: plan.models.length,
    rejected: plan.inputOffers - plan.offers.length - plan.duplicates,
    added,
    updated,
    unchanged,
    older,
    saved: added + updated + unchanged - plan.duplicates,
    duplicatesInFile: plan.duplicates,
    errors: plan.errors,
    warnings: plan.warnings,
  };
}
