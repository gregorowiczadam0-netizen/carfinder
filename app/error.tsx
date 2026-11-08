"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="shell page-intro">
      <h1>Nie udało się wczytać danych.</h1>
      <p>
        Sprawdź połączenie z bazą danych. Przy pierwszym uruchomieniu wykonaj
        npm run db:setup.
      </p>
      <button className="button primary" onClick={reset}>
        Spróbuj ponownie
      </button>
    </section>
  );
}
