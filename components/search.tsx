"use client";
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  ChartNoAxesCombined,
  GitCompareArrows,
  X,
  CarFront,
} from "lucide-react";
import {
  BRANDS,
  BODIES,
  FUELS,
  GEARBOXES,
  type Car,
  type Filters,
  defaultFilters,
  filterCars,
} from "@/lib/catalog";
import { scoreCar } from "@/lib/score";
import { CarCard } from "./car-card";
import { CarArt } from "./car-art";
import { useGarage } from "./garage";
export function Catalog({
  cars,
  favoritesOnly = false,
}: {
  cars: Car[];
  favoritesOnly?: boolean;
}) {
  const { favorites, ready } = useGarage();
  const [filters, setFilters] = useState<Filters>(
      favoritesOnly
        ? {
            ...defaultFilters,
            brands: [],
            minPrice: "",
            maxPrice: "",
            maxMileage: "",
          }
        : defaultFilters,
    ),
    [sort, setSort] = useState("score"),
    [mobile, setMobile] = useState(false);
  const set = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const models = [
    ...new Set(
      cars
        .filter(
          (c) => !filters.brands.length || filters.brands.includes(c.brand),
        )
        .map((c) => c.model),
    ),
  ].sort();
  const filtered = useMemo(() => {
    const scored = new Map(cars.map((c) => [c.id, scoreCar(c, cars).total]));
    return filterCars(
      favoritesOnly ? cars.filter((c) => favorites.includes(c.id)) : cars,
      filters,
    ).sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "mileage"
            ? a.mileage - b.mileage
            : sort === "year"
              ? b.year - a.year
              : scored.get(b.id)! - scored.get(a.id)! || a.price - b.price,
    );
  }, [cars, filters, sort, favoritesOnly, favorites]);
  const invalid =
    (filters.minPrice &&
      filters.maxPrice &&
      +filters.minPrice > +filters.maxPrice) ||
    (filters.minYear && filters.maxYear && +filters.minYear > +filters.maxYear);
  const activeCount = Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length : v !== "",
  ).length;
  const clear = () =>
    setFilters({
      ...defaultFilters,
      brands: [],
      minPrice: "",
      maxPrice: "",
      maxMileage: "",
    });
  return (
    <>
      {!favoritesOnly ? (
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> MNIEJ SZUKANIA. WIĘCEJ PEWNOŚCI.
            </div>
            <h1>
              Twój następny samochód.
              <br />
              <em>Dobry wybór zaczyna się tutaj.</em>
            </h1>
            <p>
              Porównuj oferty, sprawdzaj opłacalność i znajdź samochód,
              <br className="desktop-break" /> który pasuje do Ciebie. Wszystko
              w jednym miejscu.
            </p>
            <div className="hero-benefits">
              <span>
                <ShieldCheck />
                Przejrzyste kryteria
              </span>
              <span>
                <ChartNoAxesCombined />
                Ocena opłacalności
              </span>
              <span>
                <GitCompareArrows />
                Proste porównanie
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <span className="hero-orbit" />
            <span className="hero-word">DRIVE.</span>
            <CarArt brand="BMW" hero />
            <div className="floating-score">
              <ChartNoAxesCombined size={22} />
              <span>
                Świadomy wybór<small>Porównaj, zanim zdecydujesz</small>
              </span>
              <ArrowRight size={18} />
            </div>
          </div>
        </section>
      ) : (
        <section className="shell page-intro">
          <div className="eyebrow">TWOJA KRÓTKA LISTA</div>
          <h1>
            Ulubione samochody<span className="accent">.</span>
          </h1>
          <p>
            Zapisane na tym urządzeniu. Wróć do ofert, które zwróciły Twoją
            uwagę.
          </p>
        </section>
      )}
      <div className="shell">
        <div className="demo-banner">
          <span className="demo-dot" />
          <b>Wersja demonstracyjna</b>
          <span>
            40 fikcyjnych ofert testowych. Import CSV jest oznaczony osobno.
            Żadna oferta nie jest zweryfikowana.
          </span>
          <span className="demo-pill">DEMO</span>
        </div>
      </div>
      <section className="shell catalog" id="oferty">
        <aside className={`filter-panel ${mobile ? "mobile-open" : ""}`}>
          <div className="filter-heading">
            <h2>
              <SlidersHorizontal size={18} />
              Filtry <span>{activeCount}</span>
            </h2>
            <button
              onClick={clear}
              title="Wyczyść filtry"
              aria-label="Wyczyść filtry"
            >
              <RotateCcw size={16} />
            </button>
            <button
              className="mobile-close"
              aria-label="Zamknij filtry"
              onClick={() => setMobile(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="filters-inner">
            <fieldset>
              <legend>Marka</legend>
              <div className="brand-options">
                {[...new Set([...BRANDS, ...cars.map((c) => c.brand)])].map(
                  (b) => (
                    <label
                      key={b}
                      className={filters.brands.includes(b) ? "checked" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={filters.brands.includes(b)}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            model: "",
                            brands: prev.brands.includes(b)
                              ? prev.brands.filter((v) => v !== b)
                              : [...prev.brands, b],
                          }))
                        }
                      />
                      <span>{b}</span>
                    </label>
                  ),
                )}
              </div>
              <small>Bez zaznaczenia — wszystkie marki</small>
            </fieldset>
            <label className="field">
              Model
              <select
                value={filters.model}
                onChange={(e) => set("model", e.target.value)}
              >
                <option value="">Wszystkie modele</option>
                {models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Rodzaj nadwozia
              <select
                value={filters.body}
                onChange={(e) => set("body", e.target.value)}
              >
                <option value="">Wszystkie nadwozia</option>
                {BODIES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>
                Cena <span>PLN</span>
              </legend>
              <div className="field-pair">
                <label>
                  <span className="sr-only">Cena od</span>
                  <input
                    aria-label="Cena od"
                    type="number"
                    min="0"
                    placeholder="Od"
                    value={filters.minPrice}
                    onChange={(e) => set("minPrice", e.target.value)}
                  />
                </label>
                <span>–</span>
                <label>
                  <span className="sr-only">Cena do</span>
                  <input
                    aria-label="Cena do"
                    type="number"
                    min="0"
                    placeholder="Do"
                    value={filters.maxPrice}
                    onChange={(e) => set("maxPrice", e.target.value)}
                  />
                </label>
              </div>
            </fieldset>
            <label className="field">
              Przebieg maksymalny{" "}
              <span className="input-suffix">
                <input
                  type="number"
                  min="0"
                  value={filters.maxMileage}
                  placeholder="Bez limitu"
                  onChange={(e) => set("maxMileage", e.target.value)}
                />
                <small>km</small>
              </span>
            </label>
            <fieldset>
              <legend>Rok produkcji</legend>
              <div className="field-pair">
                <label>
                  <span className="sr-only">Rocznik od</span>
                  <input
                    aria-label="Rocznik od"
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="Od"
                    value={filters.minYear}
                    onChange={(e) => set("minYear", e.target.value)}
                  />
                </label>
                <span>–</span>
                <label>
                  <span className="sr-only">Rocznik do</span>
                  <input
                    aria-label="Rocznik do"
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="Do"
                    value={filters.maxYear}
                    onChange={(e) => set("maxYear", e.target.value)}
                  />
                </label>
              </div>
            </fieldset>
            <label className="field">
              Rodzaj paliwa
              <select
                value={filters.fuel}
                onChange={(e) => set("fuel", e.target.value)}
              >
                <option value="">Wszystkie rodzaje</option>
                {FUELS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Skrzynia biegów
              <select
                value={filters.gearbox}
                onChange={(e) => set("gearbox", e.target.value)}
              >
                <option value="">Wszystkie skrzynie</option>
                {GEARBOXES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            {invalid && (
              <p role="alert" className="error">
                Wartość „od” nie może być większa niż „do”.
              </p>
            )}
            <button
              className="button primary filter-submit"
              onClick={() => {
                setMobile(false);
                document
                  .getElementById("wyniki")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Search size={17} />
              Pokaż {filtered.length} ofert
            </button>
            <button
              className="text-button reset-defaults"
              onClick={() => setFilters(defaultFilters)}
            >
              Przywróć domyślne filtry
            </button>
          </div>
        </aside>
        <div className="results" id="wyniki">
          <div className="search-row">
            <label className="search-input">
              <Search size={19} />
              <span className="sr-only">Szukaj samochodu</span>
              <input
                placeholder="Marka, model lub miasto…"
                value={filters.query}
                onChange={(e) => set("query", e.target.value)}
              />
              {filters.query && (
                <button
                  onClick={() => set("query", "")}
                  aria-label="Wyczyść wyszukiwanie"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <button
              className="button mobile-filter"
              onClick={() => setMobile(true)}
            >
              <SlidersHorizontal size={17} />
              Filtry
            </button>
          </div>
          <div className="results-heading">
            <div>
              <h2>
                {favoritesOnly
                  ? "Zapisane oferty"
                  : "Odkryj swój następny samochód"}
              </h2>
              <p aria-live="polite">
                {favoritesOnly && !ready
                  ? "Wczytywanie zapisanych ofert…"
                  : `${filtered.length} ofert spełnia Twoje kryteria`}{" "}
                <span>· Polska</span>
              </p>
            </div>
            <label className="sort">
              <span>Sortuj:</span>
              <select
                aria-label="Sortowanie"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="score">Najlepsza opłacalność</option>
                <option value="price-asc">Cena: od najniższej</option>
                <option value="price-desc">Cena: od najwyższej</option>
                <option value="mileage">Najniższy przebieg</option>
                <option value="year">Najnowszy rocznik</option>
              </select>
            </label>
          </div>
          <div className="active-filters">
            {filters.brands.map((b) => (
              <button
                key={b}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    model: "",
                    brands: prev.brands.filter((v) => v !== b),
                  }))
                }
              >
                {b}
                <X size={12} />
              </button>
            ))}
            {filters.maxPrice && (
              <button
                onClick={() => {
                  set("minPrice", "");
                  set("maxPrice", "");
                }}
              >
                {filters.minPrice
                  ? Number(filters.minPrice).toLocaleString("pl-PL")
                  : "0"}
                –{Number(filters.maxPrice).toLocaleString("pl-PL")} zł
                <X size={12} />
              </button>
            )}
            {filters.maxMileage && (
              <button onClick={() => set("maxMileage", "")}>
                do {Number(filters.maxMileage).toLocaleString("pl-PL")} km
                <X size={12} />
              </button>
            )}
          </div>
          {invalid ? (
            <div className="empty-state">
              <SlidersHorizontal />
              <h3>Sprawdź zakres filtrów</h3>
              <p>Dolna granica ceny lub rocznika jest większa od górnej.</p>
            </div>
          ) : filtered.length ? (
            <div className="car-grid">
              {filtered.map((c, i) => (
                <CarCard key={c.id} car={c} all={cars} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CarFront size={40} />
              <h3>
                {favoritesOnly
                  ? "Twoja lista czeka na pierwszego faworyta"
                  : "Nie znaleźliśmy pasujących samochodów"}
              </h3>
              <p>
                {favoritesOnly
                  ? "Kliknij serce na karcie samochodu lub zmień filtry."
                  : "Zmień kryteria lub wyczyść filtry, aby zobaczyć więcej ofert."}
              </p>
              <button className="button" onClick={clear}>
                Wyczyść filtry
              </button>
            </div>
          )}
          <div className="results-foot">
            <ShieldCheck size={16} />
            <p>
              Wynik opłacalności to wskazówka, nie wycena ani potwierdzenie
              stanu samochodu. Sprawdź kryteria w szczegółach.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
