"use client";
import Link from "next/link";
import { X, GitCompareArrows, ArrowLeft } from "lucide-react";
import { useGarage } from "./garage";
import { CarArt } from "./car-art";
import { type Car, money, number } from "@/lib/catalog";
import { scoreCar } from "@/lib/score";
export function Comparison({ cars }: { cars: Car[] }) {
  const g = useGarage(),
    selected = cars.filter((c) => g.compare.includes(c.id));
  const rows: [string, (c: Car) => string][] = [
    ["Cena", (c) => money(c.price)],
    ["Wynik opłacalności", (c) => `${scoreCar(c, cars).total} / 100`],
    ["Rok produkcji", (c) => String(c.year)],
    ["Przebieg", (c) => `${number(c.mileage)} km`],
    ["Paliwo", (c) => c.fuel],
    ["Skrzynia biegów", (c) => c.gearbox],
    ["Nadwozie", (c) => c.body],
    ["Moc", (c) => (c.power ? `${c.power} KM` : "Brak danych")],
    ["Miasto", (c) => c.city],
    [
      "Historia serwisowa",
      (c) =>
        c.serviceHistory === null
          ? "Brak danych"
          : c.serviceHistory
            ? "Zadeklarowana"
            : "Brak potwierdzenia",
    ],
    [
      "Bezwypadkowość",
      (c) =>
        c.accidentFree === null
          ? "Brak danych"
          : c.accidentFree
            ? "Zadeklarowana"
            : "Brak potwierdzenia",
    ],
    [
      "Źródło",
      (c) => (c.isDemo ? "FIKCYJNA OFERTA" : "Import CSV · niezweryfikowana"),
    ],
  ];
  return (
    <section className="shell compare-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} />
        Wróć do ofert
      </Link>
      <div className="page-intro">
        <div className="eyebrow">OBOK SIEBIE WIDAĆ WIĘCEJ</div>
        <h1>
          Porównaj. Wybierz świadomie<span className="accent">.</span>
        </h1>
        <p>Od 2 do 4 samochodów. Najważniejsze różnice w jednym miejscu.</p>
      </div>
      {!g.ready ? (
        <p role="status">Wczytywanie…</p>
      ) : selected.length < 2 ? (
        <div className="empty-state">
          <GitCompareArrows size={40} />
          <h2>Wybierz co najmniej 2 samochody</h2>
          <p>
            Przycisk „Porównaj” znajdziesz na każdej karcie. Wybrano:{" "}
            {selected.length}/4.
          </p>
          <Link href="/" className="button primary">
            Przeglądaj oferty
          </Link>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="comparison-table">
              <caption className="sr-only">
                Porównanie wybranych samochodów
              </caption>
              <thead>
                <tr>
                  <th scope="col">Twój następny wybór</th>
                  {selected.map((c, i) => (
                    <th scope="col" key={c.id}>
                      <div className="compare-car">
                        <button
                          aria-label={`Usuń ${c.brand} ${c.model} z porównania`}
                          onClick={() => g.toggleCompare(c.id)}
                        >
                          <X size={18} />
                        </button>
                        <CarArt brand={c.brand} variant={i} />
                        <span className="demo-tag inline">
                          {c.isDemo ? "FIKCYJNA OFERTA" : "IMPORT CSV"}
                        </span>
                        <Link href={`/oferta/${c.id}`}>
                          {c.brand} {c.model}
                        </Link>
                        <small>{c.trim}</small>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {selected.map((c) => (
                      <td
                        key={c.id}
                        className={
                          label === "Wynik opłacalności" ? "accent" : ""
                        }
                      >
                        {get(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="subtle">
            Wyniki są wstępne i uwzględniają kompletność danych. Kliknij nazwę
            samochodu, aby zobaczyć kryteria i braki informacji. Ilustracje są
            poglądowe.
          </p>
        </>
      )}
    </section>
  );
}
