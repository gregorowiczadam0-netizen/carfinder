"use client";
import { useState, type FormEvent } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
export function ImportForm() {
  const [file, setFile] = useState<File | null>(null),
    [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [details, setDetails] = useState<string[]>([]),
    [result, setResult] = useState<{
      added: number;
      duplicates?: number;
      unchanged?: number;
      updated?: number;
      saved?: number;
      rejected?: number;
      errors?: { message: string; id?: string; index?: number }[];
      warnings?: { message: string; id?: string }[];
    } | null>(null),
    [consent, setConsent] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setError("");
    setDetails([]);
    if (!file) {
      setError("Wybierz plik CSV lub JSON.");
      return;
    }
    const isJson = file.name.toLowerCase().endsWith(".json");
    if (file.size > (isJson ? 10 : 1) * 1024 * 1024) {
      setError(`Maksymalny rozmiar pliku to ${isJson ? 10 : 1} MB.`);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": isJson
            ? "application/json"
            : "text/csv; charset=utf-8",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: await file.text(),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Import nie powiódł się.");
        setDetails(
          (data.errors || []).map((e: string | { message: string }) =>
            typeof e === "string" ? e : e.message,
          ),
        );
      } else setResult(data);
    } catch {
      setError(
        "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel import-form" onSubmit={submit}>
      <h2>
        <FileSpreadsheet size={21} />
        Dodaj oferty z pliku
      </h2>
      <label className="upload-zone">
        <Upload size={30} />
        <b>{file ? file.name : "Wybierz plik CSV lub JSON"}</b>
        <span>
          CSV: 1 MB / 500 ofert · JSON snapshot: 10 MB / 100 000 ofert
        </span>
        <input
          aria-label="Plik CSV lub JSON"
          type="file"
          accept=".csv,.json,text/csv,application/json"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
          }}
          required
        />
      </label>
      <label className="field">
        Token importu{" "}
        <small>Opcjonalny lokalnie; wymagany na publicznym serwerze</small>
        <input
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token skonfigurowany przez administratora"
        />
      </label>
      <label className="consent">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Mam prawo do wykorzystania tych danych. Oznaczyłem fikcyjne oferty
          jako <code>isDemo=true</code>. Plik nie zawiera danych osobowych. JSON
          snapshot zawiera historyczne dane ofert, nie potwierdzenie ich
          aktywności.
        </span>
      </label>
      <button
        className="button primary"
        disabled={busy || !consent || !file}
        type="submit"
      >
        <Upload size={18} />
        {busy ? "Walidacja i import…" : "Zweryfikuj i importuj"}
      </button>
      {error && (
        <div role="alert" className="error-box">
          <b>{error}</b>
          {details.length > 0 && (
            <ul>
              {details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {result && (
        <div role="status" className="success-box">
          <CheckCircle2 />
          <div>
            <b>Import zakończony</b>
            <p>
              Dodano: {result.added}. Pominięte duplikaty:{" "}
              {result.duplicates ?? result.unchanged ?? 0}.
            </p>
            {result.saved !== undefined && (
              <p>
                Zapisanych / obecnych: {result.saved}. Aktualizacje:{" "}
                {result.updated}. Odrzucone: {result.rejected}.
              </p>
            )}
            {!!result.errors?.length && (
              <details open>
                <summary>Błędy ({result.errors.length})</summary>
                <ul>
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      {e.id ||
                        (e.index !== undefined ? `Wiersz ${e.index + 1}` : "")}
                      : {e.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {!!result.warnings?.length && (
              <details>
                <summary>Ostrzeżenia ({result.warnings.length})</summary>
                <ul>
                  {result.warnings.map((e, i) => (
                    <li key={i}>
                      {e.id}: {e.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <a href="/">
              Zobacz oferty <ArrowRight size={15} />
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
