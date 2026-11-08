import { rmSync } from "node:fs";
// Wyłącznie oddzielna baza testowa. Nie używamy DATABASE_PATH z konfiguracji użytkownika.
for (const suffix of ["", "-wal", "-shm"])
  rmSync(`data/e2e.db${suffix}`, { force: true });
