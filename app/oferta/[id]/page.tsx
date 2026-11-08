import { modelProfile } from "@/lib/market-db";
import { ModelInsights } from "@/components/model-insights";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Info } from "lucide-react";
import { listings } from "@/lib/db";
import { scoreCar } from "@/lib/score";
import { money, number, sourceLabel } from "@/lib/catalog";
import { CarArt } from "@/components/car-art";
import { DetailActions } from "@/components/detail-actions";
export const dynamic = "force-dynamic";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await listings.find(id);
  if (!car) notFound();
  const all = await listings.all();
  const score = scoreCar(car, all);
  const profile = modelProfile(car.modelProfileId);
  const specs = [
    ["Rok produkcji", car.year],
    ["Przebieg", `${number(car.mileage)} km`],
    ["Paliwo", car.fuel || "Brak danych"],
    ["Skrzynia biegów", car.gearbox || "Brak danych"],
    ["Nadwozie", car.body || "Brak danych"],
    ["Silnik", car.engine || "Brak danych"],
    ["Moc silnika", car.power ? `${car.power} KM` : "Brak danych"],
    [
      "Historia serwisowa",
      car.serviceHistory === null
        ? "Brak danych"
        : car.serviceHistory
          ? "Zadeklarowana"
          : "Brak potwierdzenia",
    ],
    [
      "Bezwypadkowość",
      car.accidentFree === null
        ? "Brak danych"
        : car.accidentFree
          ? "Zadeklarowana"
          : "Brak potwierdzenia",
    ],
  ];
  return (
    <section className="shell detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} />
        Wróć do ofert
      </Link>
      <div className="detail-grid">
        <div>
          <div className="detail-art">
            <span className="demo-tag">{sourceLabel(car)}</span>
            <CarArt brand={car.brand} hero />
            <span className="illustration">
              Autorska ilustracja poglądowa, nie zdjęcie samochodu
            </span>
          </div>
          <div className="panel detail-specs">
            <h2>Samochód w szczegółach</h2>
            <dl>
              {specs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="panel">
            <h2>Opis oferty</h2>
            <p className="description">{car.description}</p>
            <p className="subtle">
              Źródło:{" "}
              {car.source === "demo"
                ? "fikcyjne dane demonstracyjne"
                : car.source === "otomoto"
                  ? "OTOMOTO — plik JSON użytkownika"
                  : "ręczny import CSV"}{" "}
              · ID: {car.externalId || car.id}
            </p>
          </div>
          {profile && <ModelInsights {...profile} />}
        </div>
        <aside>
          <div className="panel detail-summary">
            <div className="eyebrow">
              {car.isDemo ? "SAMOCHÓD DEMONSTRACYJNY" : "OFERTA ZAIMPORTOWANA"}
            </div>
            <h1>
              {car.brand} {car.model}
            </h1>
            <p>{car.trim}</p>
            <span className="location">
              <MapPin size={15} />
              {car.city || "Miasto: brak danych"}
            </span>
            <strong className="detail-price">{money(car.price)}</strong>
            <DetailActions id={car.id} />
            {car.sourceUrl && (
              <>
                <a
                  className="button primary source-link"
                  href={car.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Zobacz ogłoszenie na OTOMOTO ↗
                </a>
                <p className="quality-warning">
                  Aktywność ogłoszenia nie została zweryfikowana. Snapshot:{" "}
                  {car.snapshotDate}. Link może prowadzić do nieaktywnej oferty.
                </p>
              </>
            )}
            <div className="info-box">
              <Info size={18} />
              <p>
                {car.isDemo
                  ? "Ta oferta jest fikcyjna. Samochód nie jest na sprzedaż."
                  : "Dane dostarczył użytkownik. CarFinder nie potwierdza ich wiarygodności ani prawa do publikacji."}
              </p>
            </div>
          </div>
          <div className="panel score-panel" id="ocena">
            <div className="score-title">
              <div>
                <div className="eyebrow">WSTĘPNA OCENA</div>
                <h2>Opłacalność</h2>
              </div>
              <div className="big-score">
                {score.total}
                <small>/100</small>
              </div>
            </div>
            <p className="subtle">
              Heurystyka na podstawie danych w katalogu.{" "}
              {car.isDemo
                ? "Porównanie wyłącznie z fikcyjnymi ofertami."
                : "Oferty demo wyłączono z próby."}
            </p>
            {score.capReason && (
              <p className="quality-warning">
                {score.capReason} Suma surowa: {score.rawTotal}/100.
              </p>
            )}
            {score.warnings.map((w) => (
              <p className="quality-warning" key={w}>
                {w}
              </p>
            ))}
            {score.criteria.map((c) => (
              <div className="criterion" key={c.label}>
                <div>
                  <b>{c.label}</b>
                  <span>
                    {c.points}/{c.max}
                  </span>
                </div>
                <div className="meter">
                  <span style={{ width: `${(c.points / c.max) * 100}%` }} />
                </div>
                <small>{c.note}</small>
              </div>
            ))}
            {score.missing.length > 0 && (
              <div className="missing">
                <h3>Brakujące dane</h3>
                <ul>
                  {score.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                <p>
                  Brak danych oznacza 0 punktów w danym kryterium; suma nie jest
                  przeskalowywana.
                </p>
              </div>
            )}
            <p className="disclaimer">
              To nie jest wycena rynkowa ani ocena techniczna. Deklaracje nie
              zostały zweryfikowane. Przed zakupem sprawdź VIN, dokumenty i stan
              pojazdu.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
