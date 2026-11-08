"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
type Garage = {
  favorites: string[];
  compare: string[];
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  ready: boolean;
  notice: string;
};
const Context = createContext<Garage | null>(null);
function read(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value.filter((v: unknown) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}
export function GarageProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]),
    [compare, setCompare] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    setFavorites(read("carfinder:favorites"));
    setCompare(read("carfinder:compare").slice(0, 4));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("carfinder:favorites", JSON.stringify(favorites));
        localStorage.setItem("carfinder:compare", JSON.stringify(compare));
      } catch {
        setNotice(
          "Pamięć przeglądarki jest niedostępna. Wybór zachowasz tylko w tej sesji.",
        );
      }
  }, [favorites, compare, ready]);
  const toggleFavorite = (id: string) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  const toggleCompare = (id: string) => {
    if (!compare.includes(id) && compare.length >= 4) {
      setNotice(
        "Możesz porównać maksymalnie 4 samochody. Usuń jeden z zaznaczonych.",
      );
      return;
    }
    setNotice("");
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };
  return (
    <Context.Provider
      value={{
        favorites,
        compare,
        toggleFavorite,
        toggleCompare,
        ready,
        notice,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Zamknij komunikat" onClick={() => setNotice("")}>
            <X size={18} />
          </button>
        </div>
      )}
      {compare.length > 0 && (
        <aside className="compare-tray" aria-label="Wybrane do porównania">
          <div>
            <b>{compare.length}/4 samochody</b>
            <span>Porównaj i znajdź swój typ</span>
          </div>
          <button className="text-button" onClick={() => setCompare([])}>
            Wyczyść
          </button>
          <Link href="/porownaj" className="button primary">
            Porównaj <ArrowRight size={17} />
          </Link>
        </aside>
      )}
    </Context.Provider>
  );
}
export function useGarage() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Brak GarageProvider");
  return ctx;
}
