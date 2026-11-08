import Link from "next/link";
export default function NotFound() {
  return (
    <section className="shell page-intro">
      <div className="eyebrow">404</div>
      <h1>Tej oferty nie ma w garażu.</h1>
      <p>Oferta nie istnieje lub została usunięta.</p>
      <Link className="button primary" href="/">
        Wróć do wyszukiwania
      </Link>
    </section>
  );
}
