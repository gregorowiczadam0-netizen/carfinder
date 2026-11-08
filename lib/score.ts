import type { Car } from "./catalog";
export function scoreCar(
  car: Car,
  all: Car[],
  currentYear = new Date().getFullYear(),
) {
  const peers = all.filter(
    (c) =>
      c.id !== car.id &&
      c.isDemo === car.isDemo &&
      c.brand === car.brand &&
      c.model === car.model &&
      c.body === car.body &&
      c.fuel === car.fuel &&
      Math.abs(c.year - car.year) <= 3,
  );
  const prices = peers.map((c) => c.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length >= 3
      ? prices.length % 2
        ? prices[mid]
        : (prices[mid - 1] + prices[mid]) / 2
      : null;
  const missing: string[] = [];
  if (!median)
    missing.push(
      "Za mało podobnych ofert (minimum 3); cena nie została oceniona.",
    );
  if (car.serviceHistory === null)
    missing.push("Brak informacji o historii serwisowej.");
  if (car.accidentFree === null)
    missing.push("Brak informacji o bezwypadkowości.");
  if (car.power === null)
    missing.push("Brak mocy silnika (nie wpływa na wynik).");
  const clamp = (n: number, max: number) =>
    Math.max(0, Math.min(max, Math.round(n)));
  const criteria = [
    {
      label: "Cena względem podobnych ofert",
      points: median
        ? clamp(20 + ((median - car.price) / median) * 100, 40)
        : 0,
      max: 40,
      note: median
        ? `Mediana ${Math.round(median)} zł · ${peers.length} porównywalnych ofert`
        : "Brak wiarygodnej próby",
    },
    {
      label: "Przebieg",
      points: clamp(25 * (1 - car.mileage / 300000), 25),
      max: 25,
      note: "25 pkt przy 0 km, 0 pkt przy 300 tys. km",
    },
    {
      label: "Wiek samochodu",
      points: clamp(15 * (1 - Math.max(0, currentYear - car.year) / 25), 15),
      max: 15,
      note: `Liniowo od 15 do 0 pkt przez 25 lat · rok odniesienia ${currentYear}`,
    },
    {
      label: "Historia serwisowa",
      points: car.serviceHistory === true ? 10 : 0,
      max: 10,
      note:
        car.serviceHistory === null
          ? "Brak danych"
          : car.serviceHistory
            ? "Zadeklarowana w ofercie"
            : "Niezadeklarowana",
    },
    {
      label: "Bezwypadkowość",
      points: car.accidentFree === true ? 10 : 0,
      max: 10,
      note:
        car.accidentFree === null
          ? "Brak danych"
          : car.accidentFree
            ? "Zadeklarowana w ofercie"
            : "Nie potwierdzono w ofercie",
    },
  ];
  return {
    total: criteria.reduce((s, c) => s + c.points, 0),
    criteria,
    missing,
    median,
    peerCount: peers.length,
    discount: median ? Math.round(((median - car.price) / median) * 100) : null,
  };
}
