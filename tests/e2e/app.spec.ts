import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
test("snapshot, filtry, ulubione, porównanie i szczegóły z danymi modelu", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Twój następny samochód." }),
  ).toBeVisible();
  await expect(page.locator(".results-heading:visible")).toContainText(
    "107 ofert",
  );
  await expect(page.locator(".car-card:visible")).toHaveCount(24);
  await page.getByRole("button", { name: "Pokaż cały snapshot" }).click();
  await expect(page.locator(".results-heading:visible")).toContainText(
    "787 ofert",
  );
  await page
    .getByRole("combobox", { name: "Model", exact: true })
    .selectOption("Klasa C");
  await expect(page.locator(".results-heading:visible")).toContainText(
    "62 ofert",
  );
  await expect(page.locator(".card-title:visible").first()).toContainText(
    "Mercedes-Benz",
  );
  await page.getByRole("button", { name: "Przywróć domyślne filtry" }).click();
  await page.getByRole("combobox", { name: "Sortowanie" }).selectOption("price-asc");
  await expect(page.locator(".card-price strong:visible").first()).toContainText(
    /10\D?000/,
  );
  await page
    .getByRole("button", { name: /Dodaj do ulubionych/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /^Porównaj:/ })
    .nth(0)
    .click();
  await page
    .getByRole("button", { name: /^Porównaj:/ })
    .nth(0)
    .click();
  await page.goto("/porownaj");
  await expect(page.locator(".comparison-table:visible")).toBeVisible();
  await expect(page.locator(".compare-car:visible")).toHaveCount(2);
  await expect(page.locator(".comparison-table:visible")).toContainText("Brak danych");
  await expect(page.locator(".comparison-table:visible")).toContainText("2026-11-08");
  await page.goto("/ulubione");
  await expect(page.locator(".car-card:visible")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".car-card:visible")).toHaveCount(1);
  await page.locator(".card-title a:visible").click();
  await expect(page.locator(".model-insights:visible")).toContainText(
    "DANE MODELU · NIE KONKRETNEGO POJAZDU",
  );
  await expect(page.locator(".model-insights:visible")).toContainText(
    "To nie jest całkowity koszt eksploatacji",
  );
  await expect(
    page.getByRole("link", { name: /Zobacz ogłoszenie na OTOMOTO/ }),
  ).toHaveAttribute("href", /^https:\/\/www.otomoto.pl\//);
  await expect(page.locator(".detail-summary:visible")).toContainText(
    "Aktywność ogłoszenia nie została zweryfikowana",
  );
  await expect(page.locator(".detail-specs:visible")).toContainText("Brak danych");
  await expect(page.locator(".criterion:visible")).toHaveCount(5);
  await page.goto("/");
  await page.getByRole("button", { name: "Demo (40)", exact: true }).click();
  await expect(page.locator(".results-heading:visible")).toContainText(
    "27 ofert",
  );
  await page
    .getByRole("button", { name: "Wyczyść filtry", exact: true })
    .click();
  await expect(page.locator(".results-heading:visible")).toContainText(
    "40 ofert",
  );
  await expect(page.locator(".demo-tag:visible").first()).toContainText("FIKCYJNA");
  await page
    .getByRole("textbox", { name: "Szukaj samochodu" })
    .fill("brak-takiego-samochodu");
  await expect(page.locator(".car-card:visible")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("CSV nadal waliduje, deduplikuje i trafia do kategorii demo", async ({
  page,
  request,
}) => {
  await page.goto("/import");
  const csv =
    "brand,model,body,price,mileage,year,fuel,gearbox,city,description,isDemo,externalId\nVolvo,S80,Sedan,18500,178000,2009,Benzyna,Automatyczna,Łódź,Fikcyjny test,true,e2e-unique";
  await page
    .locator('input[type="file"]:visible')
    .setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv.replace("18500", "-1")),
    });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Zweryfikuj i importuj" }).click();
  await expect(page.locator(".error-box:visible")).toContainText("Żadna oferta");
  await page
    .locator('input[type="file"]:visible')
    .setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
  await page.getByRole("button", { name: "Zweryfikuj i importuj" }).click();
  await expect(page.getByRole("status")).toContainText("Dodano: 1");
  await page.getByRole("button", { name: "Zweryfikuj i importuj" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Dodano: 0. Pominięte duplikaty: 1.",
  );
  const response = await request.post("/api/import", { data: csv });
  expect(response.status()).toBe(403);
  await page.getByRole("link", { name: "Zobacz oferty" }).click();
  await page.getByRole("button", { name: "Demo (41)", exact: true }).click();
  await page.getByRole("textbox", { name: "Szukaj samochodu" }).fill("S80");
  await expect(page.locator(".car-card:visible")).toHaveCount(1);
});
test("JSON powyżej limitu CSV: raport 787 zapisanych, powtórny import bez duplikatów", async ({
  page,
  request,
}) => {
  await page.goto("/import");
  await page
    .locator('input[type="file"]:visible')
    .setInputFiles({
      name: "snapshot.json",
      mimeType: "application/json",
      buffer: readFileSync("datasets/carfinder-rynek-pl.json"),
    });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Zweryfikuj i importuj" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Zapisanych / obecnych: 787",
  );
  await expect(page.getByRole("status")).toContainText("Ostrzeżenia (6)");
  await expect(page.getByRole("status")).toContainText(
    "Pominięte duplikaty: 787",
  );
  const bad = await request.post("/api/import", {
    headers: {
      origin: "http://localhost:3001",
      "Content-Type": "application/json",
    },
    data: "{",
  });
  expect(bad.status()).toBe(422);
});
test("podejrzany przebieg nie dostaje punktów ani automatycznej korekty", async ({
  page,
}) => {
  await page.goto("/oferta/otomoto-6151183959");
  await expect(page.locator(".detail-specs:visible")).toContainText("388 km");
  await expect(page.locator(".score-panel:visible")).toContainText(
    "Przebieg do sprawdzenia",
  );
  await expect(page.locator(".criterion:visible").nth(1)).toContainText("0/25");
  await expect(page.locator(".score-panel:visible")).toContainText("Limit 30/100");
});
test("mobilny widok i filtry nie wychodzą poza ekran", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Filtry", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Cena do", exact: true })
    .fill("16000");
  await page.getByRole("button", { name: /Pokaż \d+ ofert/ }).click();
  await expect(page.locator(".filter-panel.mobile-open:visible")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
