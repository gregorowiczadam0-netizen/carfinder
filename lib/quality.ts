export function mileageWarning(
  mileage: number,
  year: number,
  referenceYear = new Date().getFullYear(),
) {
  const age = Math.max(0, referenceYear - year);
  if (mileage === 0 || (age >= 5 && mileage < Math.max(1000, age * 1000)))
    return "Przebieg do sprawdzenia: nietypowo niski względem wieku. Możliwa pomyłka jednostek lub wpisu; nie korygujemy wartości.";
  if (mileage > 500000)
    return "Przebieg do sprawdzenia: ponad 500 tys. km. Zweryfikuj dokumentację i stan pojazdu.";
  return null;
}
