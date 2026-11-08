import { ImportForm } from "@/components/import-form";
import { Download, ShieldCheck } from "lucide-react";
export const metadata = { title: "Import CSV" };
export default function ImportPage() {
  return (
    <section className="shell">
      <div className="page-intro">
        <div className="eyebrow">TWOJE DANE, JEDNO MIEJSCE</div>
        <h1>
          Więcej ofert. Pełna kontrola<span className="accent">.</span>
        </h1>
        <p>
          Importuj dane, do których masz uprawnienia. Nie pobieramy ogłoszeń
          automatycznie.
        </p>
      </div>
      <div className="import-grid">
        <ImportForm />
        <aside className="panel import-help">
          <h2>Przygotuj swój plik</h2>
          <p>
            Każdy wiersz to jedna oferta. Nazwy kolumn pozostają po angielsku;
            wartości kategorii są po polsku.
          </p>
          <a className="button" href="/przyklad.csv" download>
            <Download size={17} />
            Pobierz fikcyjny przykład
          </a>
          <h3>Wymagane kolumny</h3>
          <code className="column-list">
            brand, model, body, price, mileage, year, fuel, gearbox, city,
            description, isDemo
          </code>
          <h3>Pola opcjonalne</h3>
          <code className="column-list">
            trim, power, serviceHistory, accidentFree, externalId
          </code>
          <ul>
            <li>Cena w PLN i przebieg w km — liczby całkowite bez spacji.</li>
            <li>Nadwozie: Sedan, Kombi, SUV, Coupé, Hatchback, Kabriolet.</li>
            <li>Paliwo: Benzyna, Diesel, Hybryda, Elektryczny, LPG.</li>
            <li>Skrzynia: Manualna lub Automatyczna.</li>
            <li>
              isDemo: true dla fikcyjnych danych, false dla rzeczywistych.
            </li>
            <li>
              Historia i bezwypadkowość: true, false albo puste (brak danych).
            </li>
          </ul>
          <div className="info-box">
            <ShieldCheck size={20} />
            <p>
              Cały plik jest walidowany przed zapisem. Błędny wiersz odrzuca
              cały import. Duplikaty są pomijane po treści lub identyfikatorze
              źródła. Oferty demo nie służą do oceny cen rzeczywistych.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
