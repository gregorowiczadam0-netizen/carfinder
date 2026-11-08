import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command:
      "node scripts/reset-e2e-db.mjs && DATABASE_PATH=data/e2e.db npm run db:setup && DATABASE_PATH=data/e2e.db npm run start -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
