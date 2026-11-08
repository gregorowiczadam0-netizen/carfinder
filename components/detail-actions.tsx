"use client";
import { Heart, GitCompareArrows } from "lucide-react";
import { useGarage } from "./garage";
export function DetailActions({ id }: { id: string }) {
  const g = useGarage();
  return (
    <div className="detail-actions">
      <button
        className="button primary"
        aria-pressed={g.compare.includes(id)}
        onClick={() => g.toggleCompare(id)}
      >
        <GitCompareArrows size={18} />
        {g.compare.includes(id) ? "Usuń z porównania" : "Dodaj do porównania"}
      </button>
      <button
        className="button"
        aria-pressed={g.favorites.includes(id)}
        onClick={() => g.toggleFavorite(id)}
      >
        <Heart
          size={18}
          fill={g.favorites.includes(id) ? "currentColor" : "none"}
        />
        {g.favorites.includes(id) ? "W ulubionych" : "Zapisz ofertę"}
      </button>
    </div>
  );
}
