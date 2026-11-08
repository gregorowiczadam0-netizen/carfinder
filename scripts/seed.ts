import { listings } from "../lib/db";
import { fingerprint } from "../lib/import";
const families = [
  ["BMW", "Seria 3", "320i · E90", "Sedan", "Benzyna"],
  ["BMW", "Seria 5", "520d · E60", "Sedan", "Diesel"],
  ["Mercedes", "Klasa C", "C 180 · W204", "Sedan", "Benzyna"],
  ["Mercedes", "Klasa E", "E 220 CDI · W211", "Kombi", "Diesel"],
  ["Jaguar", "X-Type", "2.0 V6 Executive", "Sedan", "Benzyna"],
  ["Jaguar", "S-Type", "2.7 D Executive", "Sedan", "Diesel"],
  ["Volvo", "S60", "2.0 T Momentum", "Sedan", "Benzyna"],
  ["Volvo", "V50", "2.0 D Kinetic", "Kombi", "Diesel"],
];
async function main() {
  for (let f = 0; f < families.length; f++)
    for (let j = 0; j < 5; j++) {
      const [brand, model, trim, body, fuel] = families[f];
      const index = f * 5 + j;
      const data = {
        brand,
        model,
        trim,
        body,
        fuel,
        price: [12900, 15900, 17900, 19900, 24900][j] + (f % 3) * 200,
        mileage: [146000, 173000, 188000, 199000, 224000][j] + f * 100,
        year: 2007 + j,
        gearbox: j % 2 ? "Manualna" : "Automatyczna",
        power: index % 7 === 0 ? null : 140 + f * 10,
        city: ["Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk"][j],
        description: `FIKCYJNA OFERTA TESTOWA. ${brand} ${model} ${trim}. Dane służą wyłącznie prezentacji funkcji CarFinder. Samochód nie istnieje i nie jest dostępny do zakupu. Informacje o stanie i historii są symulacją.`,
        serviceHistory: index % 5 === 0 ? null : index % 3 !== 0,
        accidentFree: index % 6 === 0 ? null : index % 4 !== 0,
        isDemo: true,
        source: "demo",
        externalId: `demo-${index + 1}`,
      };
      listings.seed(
        { ...data, fingerprint: fingerprint(data) },
        `demo-${index + 1}`,
      );
    }
  console.log("Gotowe: 40 fikcyjnych ofert demo (seed idempotentny).");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
