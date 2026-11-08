# CarFinder

Działające MVP polskiej wyszukiwarki samochodów używanych. Next.js App Router, React, TypeScript, Tailwind CSS 4 i trwała baza SQLite. Interfejs po polsku, dark mode, układ mobilny. Bez płatnych API, kluczy i automatycznego pobierania ogłoszeń.

## Uruchomienie

Wymagany **Node.js 24+** i npm. Wszystkie polecenia wykonuj w katalogu projektu (`/workspace/carfinder` w tym środowisku).

```bash
npm ci
cp .env.example .env  # tylko przy pierwszym uruchomieniu, nie nadpisuj własnej konfiguracji
npm run db:setup
npm run dev
```

Otwórz aplikację pod adresem lokalnego serwera wypisanym przez Next.js (domyślnie port 3000). W środowisku chmurowym użyj dostępnego podglądu/forwardowania portu. Przywrócone środowisko nie zachowuje uruchomionych procesów: ponownie uruchom `npm run dev`. Korzystaj z istniejącego checkoutu; osobny worktree nie jest potrzebny.

W sandboxie tego środowiska instaluj przez `npm ci --cache /tmp/carfinder-npm`, jeżeli domyślny cache npm poza `/workspace` jest niezapisywalny. Weryfikacja pakietów i TLS pozostaje włączona.

Produkcja na serwerze Node z zapisywalnym, trwałym dyskiem:

```bash
npm run db:setup
npm run build
npm run start
```

Baza domyślnie znajduje się w `data/carfinder.db`. `DATABASE_PATH` może wskazywać inną ścieżkę (względną wobec katalogu projektu lub absolutną). `db:setup` stosuje wersjonowane migracje SQL i dodaje brakujące oferty demo; powtórzenie nie usuwa danych ani nie tworzy duplikatów. Kopię działającej bazy wykonuj mechanizmem backup SQLite; pliki WAL mogą zawierać niezapisane do głównego pliku transakcje. Pliki bazy, `.env` i artefakty nie trafiają do Git.

### Dlaczego bez Prisma?

Sprawdzono instalację Prisma 6 i 7. Polityka sieciowa środowiska blokuje `binaries.prisma.sh` (HTTP 403), niezbędne do generowania klienta/obsługi schematu. Nie wyłączano weryfikacji sum kontrolnych ani TLS. MVP używa wbudowanego w Node.js 24 `node:sqlite`, parametryzowanych zapytań i transakcji; nie wymaga zewnętrznego silnika. Warstwa danych jest wydzielona w `lib/db.ts`. Prisma można wdrożyć później, po uzyskaniu dostępu sieciowego i przygotowaniu migracji istniejącej bazy. Baza działa lokalnie; aplikacja nie jest przeznaczona dla Edge Runtime ani instancji serverless bez trwałego dysku.

## Funkcje

- 40 **fikcyjnych** ofert (8 modeli, 4 marki), widoczne oznaczenia demo i autorskie ilustracje SVG zamiast zdjęć sugerujących prawdziwe samochody. Oferty demo nie są dostępne do zakupu.
- Wyszukiwanie marki, modelu i miasta; filtry marki (wielokrotny wybór), modelu, nadwozia, ceny od/do, maksymalnego przebiegu, rocznika od/do, paliwa i skrzyni biegów. Działają od razu po zmianie.
- Domyślnie BMW, Mercedes, Jaguar, Volvo; 10–20 tys. zł i do 200 tys. km. 27 z 40 ofert demo spełniają ten zakres. Reset do domyślnych lub wyczyszczenie wszystkich filtrów.
- Sortowanie po opłacalności, cenie w obu kierunkach, najniższym przebiegu i najnowszym roczniku.
- Szczegóły `/oferta/[id]`, porównanie 2–4 samochodów `/porownaj`, ulubione `/ulubione`. Wybory zapisują się w localStorage na urządzeniu; nie ma kont ani synchronizacji.
- Heurystyka opłacalności 0–100 z kryteriami, medianą próby i listą braków.
- Import CSV `/import`: maks. 1 MB i 500 ofert, UTF-8 z opcjonalnym BOM, separator przecinek lub średnik, cytowane pola, walidacja wszystkich wierszy przed zapisem. Błąd odrzuca cały plik. Zapis w jednej transakcji.
- Deduplikacja w obrębie pliku i bazy: SHA-256 z normalizowanych pól marka/model/rok/cena/przebieg/miasto/isDemo oraz para źródło/externalId. Jest to deduplikacja konserwatywna: zmieniona cena i brak identyfikatora mogą oznaczać nowy rekord; nie jest to identyfikacja samochodu po VIN.
- Brak automatycznych integracji. `lib/sources.ts` definiuje kontrakt przyszłych adapterów, a `CsvSource` normalizację pliku użytkownika. Autoryzowane źródła wymagają osobnej implementacji i potwierdzenia licencji/uprawnień.

## Wynik opłacalności

Wynik jest wskazówką i nie stanowi wyceny, rekomendacji zakupu ani potwierdzenia stanu technicznego.

| Kryterium      | Punkty   | Sposób obliczenia                                            |
| -------------- | -------- | ------------------------------------------------------------ |
| Cena           | 0–40     | `20 + 100 × (mediana − cena) / mediana`, ograniczone do 0–40 |
| Przebieg       | 0–25     | liniowo od 25 przy 0 km do 0 przy 300 tys. km                |
| Wiek           | 0–15     | liniowo od 15 przy wieku 0 do 0 przy wieku 25 lat            |
| Serwis         | 0 lub 10 | deklaracja historii serwisowej                               |
| Bezwypadkowość | 0 lub 10 | deklaracja bezwypadkowości                                   |

Próba ceny wymaga co najmniej 3 innych ofert tej samej marki, modelu, nadwozia i paliwa, z rocznikiem różniącym się najwyżej o 3 lata. Oferty demo i rzeczywiste nigdy nie należą do jednej próby. Mediana nie uwzględnia ocenianej oferty. Brak próby daje 0/40 i ostrzeżenie; brak deklaracji daje 0/10, bez przeskalowywania sumy. Brak mocy jest ujawniany, ale nie zmienia wyniku. Rok odniesienia to bieżący rok serwera/przeglądarki. Mała lub niepełna próba ogranicza użyteczność oceny; silnik, wyposażenie, historia i stan techniczny nie są wyceniane.

## Import i bezpieczeństwo

Format opisano w interfejsie; plik `public/przyklad.csv` jest fikcyjnym, działającym przykładem. Kolumny wymagane: `brand,model,body,price,mileage,year,fuel,gearbox,city,description,isDemo`. Opcjonalne: `trim,power,serviceHistory,accidentFree,externalId`. Dane liczbowe to liczby całkowite bez separatorów. `isDemo` musi mieć wartość `true` lub `false`; serwis i bezwypadkowość przyjmują `true`, `false` albo puste pole.

Importowane rekordy dostają źródło `csv`, są oznaczane jako niezweryfikowane, a `isDemo=true` daje dodatkowe oznaczenie fikcyjnej oferty. Nie importuj danych osobowych ani danych bez prawa do wykorzystania. Aplikacja nie weryfikuje tych uprawnień ani prawdziwości deklaracji.

Endpoint importu wymaga zgodnego nagłówka Origin. Bez tokenu jest dostępny tylko pod lokalnym hostem (localhost/127.0.0.1/IPv6 loopback). Na publicznym serwerze ustaw losowy `IMPORT_TOKEN` w środowisku serwera i podaj go w polu formularza importu. Token nie jest zapisywany w localStorage. Używaj HTTPS. Przed szerszym wdrożeniem dodaj uwierzytelnianie użytkowników, limitowanie ruchu na reverse proxy i kontrolę uprawnień; katalog i importy są obecnie wspólne dla instancji.

## Weryfikacja

```bash
npm run test          # logika CSV, filtry, scoring; SQLite: deduplikacja i rollback
npm run typecheck
npm run build
npm run test:e2e      # po buildzie: prawdziwy Chromium, osobna baza data/e2e.db i port 3001
```

Testy E2E korzystają z `/usr/bin/chromium` dostępnego w tym środowisku. Na innym komputerze ustaw `CHROMIUM_PATH` na ścieżkę zainstalowanego Chromium. Alternatywnie zainstaluj Chromium przez Playwright i przekaż jego ścieżkę. Przed każdym uruchomieniem usuwana jest wyłącznie baza `data/e2e.db` i jej pliki WAL/SHM. E2E nie zmieniają głównej bazy; baza testowa jest ignorowana przez Git. Obejmują filtrację, sortowanie, ulubione po przeładowaniu, porównanie, kryteria oceny, błędny i poprawny CSV, duplikaty, ochronę Origin oraz widok mobilny. Nie wymagają dostępu do portali ani płatnych usług.

## Struktura i dalszy rozwój

- `app/`: strony App Router i endpointy API.
- `components/`: katalog, porównanie, localStorage, import i ilustracje.
- `lib/`: typy, filtry, scoring, parser CSV, adaptery źródeł i repozytorium SQLite.
- `migrations/`, `scripts/`: wersjonowany schemat oraz idempotentne przygotowanie i seed.
- `tests/`: testy logiki, transakcji i przeglądarkowe.

Następne kroki: adapter pierwszego uprawnionego źródła, identyfikacja i aktualizacja ogłoszeń w ramach źródła, rozbudowany model samochodu, walidacja scoringu na rzeczywistych danych, autoryzacja importu per użytkownik, paginacja i filtrowanie po stronie serwera dla większego katalogu. W MVP wszystkie oferty są pobierane do katalogu klienta; SQLite i pojedynczy proces aplikacji są odpowiednie dla małej skali.
