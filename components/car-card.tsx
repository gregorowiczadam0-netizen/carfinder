"use client";
import Link from "next/link";
import {
  Heart,
  GitCompareArrows,
  ArrowUpRight,
  MapPin,
  Fuel,
  Gauge,
  CalendarDays,
} from "lucide-react";
import { type Car, money, number } from "@/lib/catalog";
import { scoreCar } from "@/lib/score";
import { useGarage } from "./garage";
import { CarArt } from "./car-art";
export function CarCard({
  car,
  all,
  index = 0,
}: {
  car: Car;
  all: Car[];
  index?: number;
}) {
  const garage = useGarage(),
    score = scoreCar(car, all),
    fav = garage.favorites.includes(car.id),
    selected = garage.compare.includes(car.id);
  return (
    <article className="car-card">
      <div className={`card-image scene-${index % 4}`}>
        <span className="demo-tag">
          {car.isDemo ? "FIKCYJNA OFERTA" : "IMPORT CSV · NIEZWERYFIKOWANA"}
        </span>
        <button
          className={`heart ${fav ? "active" : ""}`}
          aria-label={`${fav ? "Usuń z" : "Dodaj do"} ulubionych: ${car.brand} ${car.model}`}
          aria-pressed={fav}
          onClick={() => garage.toggleFavorite(car.id)}
        >
          <Heart size={19} fill={fav ? "currentColor" : "none"} />
        </button>
        <Link
          href={`/oferta/${car.id}`}
          aria-label={`Szczegóły: ${car.brand} ${car.model}`}
        >
          <CarArt brand={car.brand} variant={index} />
        </Link>
        <span className="illustration">Ilustracja poglądowa</span>
      </div>
      <div className="card-content">
        <div className="card-title">
          <div>
            <Link href={`/oferta/${car.id}`}>
              <h3>
                {car.brand} {car.model}
              </h3>
            </Link>
            <p>{car.trim || car.body}</p>
          </div>
          <ArrowUpRight size={19} />
        </div>
        <div className="specs">
          <span>
            <CalendarDays />
            {car.year}
          </span>
          <span>
            <Gauge />
            {number(car.mileage)} km
          </span>
          <span>
            <Fuel />
            {car.fuel}
          </span>
        </div>
        <div className="card-price">
          <strong>{money(car.price)}</strong>
          <span className="location">
            <MapPin size={13} />
            {car.city}
          </span>
        </div>
        <div className="card-bottom">
          <Link
            href={`/oferta/${car.id}#ocena`}
            className="score"
            title="Zobacz kryteria wyniku"
          >
            <span
              className={
                score.total >= 65 ? "score-number" : "score-number muted-score"
              }
            >
              {score.total}
            </span>
            <span>
              Opłacalność <small>/ 100 · wstępna</small>
            </span>
          </Link>
          <button
            className={`compare-button ${selected ? "selected" : ""}`}
            onClick={() => garage.toggleCompare(car.id)}
            aria-label={`${selected ? "Usuń z porównania" : "Porównaj"}: ${car.brand} ${car.model}`}
            aria-pressed={selected}
          >
            <GitCompareArrows size={17} />
            {selected ? "Wybrano" : "Porównaj"}
          </button>
        </div>
      </div>
    </article>
  );
}
