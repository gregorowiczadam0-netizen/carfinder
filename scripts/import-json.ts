import { readFileSync, statSync, writeFileSync } from "node:fs";
import { importMarketJson } from "../lib/market-db";
import { MAX_JSON_BYTES } from "../lib/market-import";
const path = process.argv[2];
if (!path) {
  console.error("Użycie: npm run db:import:json -- plik.json [raport.json]");
  process.exit(1);
}
try {
  if (statSync(path).size > MAX_JSON_BYTES)
    throw new Error("Maksymalny rozmiar JSON to 10 MB.");
  const report = importMarketJson(readFileSync(path, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  const reportPath = process.argv[3];
  if (reportPath)
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", {
      flag: "wx",
    });
  if (report.errors.length) process.exitCode = 2;
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Import nie powiódł się; transakcja została wycofana.",
  );
  process.exitCode = 1;
}
