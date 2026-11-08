import type { ModelData, SnapshotMeta } from "@/lib/market-import";
import { money, number } from "@/lib/catalog";
export function ModelInsights({
  model: m,
  meta,
}: {
  model: ModelData;
  meta: SnapshotMeta;
}) {
  return (
    <section className="panel model-insights">
      <div className="eyebrow">DANE MODELU · NIE KONKRETNEGO POJAZDU</div>
      <h2>
        Co warto wiedzieć o {m.make} {m.model}?
      </h2>
      <p className="info-box">
        Przykładowy silnik: {m.example_engine}, paliwo: {m.fuel}. Nie wiadomo,
        czy ten egzemplarz ma taki silnik lub paliwo. Usterki i koszty poniżej
        odnoszą się do modelu lub przykładowej wersji.
      </p>
      <h3>Typowe usterki / punkty kontroli</h3>
      <p>{m.inspection_points_pl}</p>
      <h3>Co sprawdzić przed zakupem</h3>
      <p>{m.price_factors_pl}</p>
      <h3>Przykładowy roczny budżet</h3>
      <p className="subtle">
        Scenariusz: {number(meta.scenario.km_per_year)} km/rok ·{" "}
        {meta.scenario.pln_per_litre} zł/l · {m.scenario_l_per_100km} l/100 km
        dla {m.example_engine}.
      </p>
      <dl className="budget">
        <div>
          <dt>Paliwo</dt>
          <dd>{money(m.annual_fuel_pln)}</dd>
        </div>
        <div>
          <dt>Olej i filtry — założenie</dt>
          <dd>{money(m.annual_oil_filters_budget_pln)}</dd>
        </div>
        <div>
          <dt>Suma częściowa / rok</dt>
          <dd>{money(m.annual_fuel_plus_oil_filters_pln)}</dd>
        </div>
      </dl>
      <p className="quality-warning">
        To nie jest całkowity koszt eksploatacji ani koszt tego egzemplarza.
      </p>
      <p className="subtle">{meta.scenario.description_pl}</p>
      <h3>Kontekst snapshotu modelu</h3>
      <p className="subtle">
        {m.offer_count} ofert · mediana {money(m.price_median_pln)} · Q1–Q3:{" "}
        {money(m.price_q1_pln)} – {money(m.price_q3_pln)}. Różne silniki i
        nadwozia; to nie jest wycena pojazdu. Snapshot: {meta.snapshot_date}.
      </p>
      <details>
        <summary>Źródła informacji o modelu (linki z pliku)</summary>
        <ul>
          {[
            ...m.technical_sources,
            m.fuel_source,
            meta.scenario.service_source,
          ].map((href, i) => (
            <li key={`${href}-${i}`}>
              <a href={href} rel="noopener noreferrer" target="_blank">
                {i < m.technical_sources.length
                  ? "Usterki / opis techniczny"
                  : i === m.technical_sources.length
                    ? "Spalanie przykładowej wersji"
                    : "Serwis — źródło scenariusza"}{" "}
                · {new URL(href).hostname} ↗
              </a>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
