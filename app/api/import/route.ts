import { importMarketJson } from "@/lib/market-db";
import { MAX_JSON_BYTES } from "@/lib/market-import";
import { listings } from "@/lib/db";
import { parseImport } from "@/lib/import";
import { timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";
const MAX_BYTES = 1024 * 1024;
function authorized(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  if (
    !["http:", "https:"].includes(originUrl.protocol) ||
    originUrl.origin !== origin ||
    originUrl.host !== request.headers.get("host")
  )
    return false;
  const token = process.env.IMPORT_TOKEN;
  if (token) {
    const sent =
      request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
    const a = Buffer.from(sent),
      b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return ["localhost", "127.0.0.1", "[::1]"].includes(originUrl.hostname);
}
export async function POST(request: Request) {
  if (!authorized(request))
    return Response.json(
      {
        error:
          "Import wymaga tego samego pochodzenia. Na publicznym serwerze skonfiguruj IMPORT_TOKEN i podaj go w formularzu.",
      },
      { status: 403 },
    );
  const isJson =
    request.headers.get("content-type")?.split(";")[0].trim() ===
    "application/json";
  const maxBytes = isJson ? MAX_JSON_BYTES : MAX_BYTES;
  if (Number(request.headers.get("content-length")) > maxBytes)
    return Response.json(
      { error: `Maksymalny rozmiar pliku to ${isJson ? 10 : 1} MB.` },
      { status: 413 },
    );
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Brak pliku." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      return Response.json(
        { error: `Maksymalny rozmiar pliku to ${isJson ? 10 : 1} MB.` },
        { status: 413 },
      );
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (isJson) {
    try {
      const report = importMarketJson(raw);
      return Response.json(
        report.snapshot
          ? report
          : {
              ...report,
              error: "Nieprawidłowy plik JSON; nie zapisano rekordów.",
            },
        { status: report.snapshot ? 200 : 422 },
      );
    } catch {
      return Response.json(
        { error: "Zapis JSON nie powiódł się. Transakcja została wycofana." },
        { status: 500 },
      );
    }
  }
  const result = parseImport(raw);
  if (result.errors.length)
    return Response.json(
      {
        error: "Import odrzucony. Żadna oferta nie została dodana.",
        errors: result.errors.slice(0, 50),
      },
      { status: 422 },
    );
  try {
    const summary = listings.import(result.rows);
    return Response.json(summary);
  } catch {
    return Response.json(
      {
        error:
          "Nie udało się zapisać importu. Spróbuj ponownie. Wszystkie zmiany wycofano.",
      },
      { status: 500 },
    );
  }
}
