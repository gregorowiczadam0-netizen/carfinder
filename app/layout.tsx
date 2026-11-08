import type { Metadata } from "next";
import Link from "next/link";
import { CarFront, ArrowUpRight } from "lucide-react";
import { GarageProvider } from "@/components/garage";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "CarFinder — znajdź swój następny samochód",
    template: "%s | CarFinder",
  },
  description:
    "Porównuj samochody i odkrywaj korzystne oferty. Wersja demonstracyjna z fikcyjnymi danymi.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <GarageProvider>
          <header className="header">
            <div className="shell nav">
              <Link
                href="/"
                className="logo"
                aria-label="CarFinder — strona główna"
              >
                <span className="logo-icon">
                  <CarFront size={23} />
                </span>
                car<span>finder</span>
                <span className="beta">BETA</span>
              </Link>
              <nav aria-label="Nawigacja główna">
                <Link href="/">Odkrywaj</Link>
                <Link href="/ulubione">Ulubione</Link>
                <Link href="/porownaj">Porównywarka</Link>
              </nav>
              <Link className="import-link" href="/import">
                Importuj CSV <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>
          <main>{children}</main>
          <footer className="shell footer">
            <Link href="/" className="logo">
              car<span>finder</span>
              <span className="beta">BETA</span>
            </Link>
            <span>Dobry samochód. Świadomy wybór.</span>
            <small>
              MVP · Dane demo są fikcyjne · Bez automatycznego pobierania ofert
            </small>
          </footer>
        </GarageProvider>
      </body>
    </html>
  );
}
