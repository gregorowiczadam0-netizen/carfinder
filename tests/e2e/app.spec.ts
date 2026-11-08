import { test, expect } from "@playwright/test";
test("katalog, filtry, sortowanie, ulubione, porównanie i szczegóły", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Twój następny samochód." }),
  ).toBeVisible();
  await expect(page.locator(".car-card")).toHaveCount(27);
  await page.getByLabel("Sortowanie").selectOption("price-asc");
  await expect(page.locator(".card-price strong").first()).toContainText("12");
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
  await expect(page.locator(".comparison-table")).toBeVisible();
  await expect(page.locator(".compare-car")).toHaveCount(2);
  await page.goto("/ulubione");
  await expect(page.locator(".car-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".car-card")).toHaveCount(1);
  await page.locator(".card-title a").click();
  await expect(
    page.getByRole("heading", { name: "Brakujące dane" }),
  ).toBeVisible();
  await expect(page.locator(".criterion")).toHaveCount(5);
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Szukaj samochodu" })
    .fill("brak-takiego-samochodu");
  await expect(page.locator(".car-card")).toHaveCount(0);
  await expect(
    page.getByText("Nie znaleźliśmy pasujących samochodów"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("import waliduje i deduplikuje, endpoint wymaga pochodzenia", async ({
  page,
  request,
}) => {
  await page.goto("/import");
  const csv =
    "brand,model,body,price,mileage,year,fuel,gearbox,city,description,isDemo,externalId\nVolvo,S80,Sedan,18500,178000,2009,Benzyna,Automatyczna,Łódź,Fikcyjny test,true,e2e-unique";
  await page
    .getByLabel("Plik CSV")
    .setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv.replace("18500", "-1")),
    });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Zweryfikuj i importuj" }).click();
  await expect(page.locator(".error-box")).toContainText("Żadna oferta");
  await page
    .getByLabel("Plik CSV")
    .setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
  await page.getByRole("button", { name: "Zweryfikuj i importuj" }).click();
  await expect(page.getByRole("status")).toContainText("Import zakończony");
  await page.getByRole("button", { name: "Zweryfikuj i importuj" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Dodano: 0. Pominięte duplikaty: 1.",
  );
  const response = await request.post("/api/import", { data: csv });
  expect(response.status()).toBe(403);
  await page.getByRole("link", { name: "Zobacz oferty" }).click();
  await page.getByRole("textbox", { name: "Szukaj samochodu" }).fill("S80");
  await expect(page.locator(".car-card")).toHaveCount(1);
});
test("mobilny widok i filtry nie wychodzą poza ekran", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Filtry", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Cena do", exact: true })
    .fill("16000");
  await page.getByRole("button", { name: /Pokaż \d+ ofert/ }).click();
  await expect(page.locator(".filter-panel.mobile-open")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
