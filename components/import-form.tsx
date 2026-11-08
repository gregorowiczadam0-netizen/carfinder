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
      duplicates: number;
    } | null>(null),
    [consent, setConsent] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setError("");
    setDetails([]);
    if (!file) {
      setError("Wybierz plik CSV.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Plik jest większy niż 1 MB.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: await file.text(),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Import nie powiódł się.");
        setDetails(data.errors || []);
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
        <b>{file ? file.name : "Wybierz plik CSV"}</b>
        <span>UTF-8 · przecinek lub średnik · maks. 1 MB / 500 ofert</span>
        <input
          aria-label="Plik CSV"
          type="file"
          accept=".csv,text/csv"
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
          jako <code>isDemo=true</code>. Plik nie zawiera danych osobowych.
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
              Dodano: {result.added}. Pominięte duplikaty: {result.duplicates}.
            </p>
            <a href="/">
              Zobacz oferty <ArrowRight size={15} />
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
