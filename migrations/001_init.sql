CREATE TABLE IF NOT EXISTS Listing (
 id TEXT PRIMARY KEY,
 fingerprint TEXT NOT NULL UNIQUE,
 brand TEXT NOT NULL, model TEXT NOT NULL, trim TEXT NOT NULL DEFAULT '', body TEXT NOT NULL,
 price INTEGER NOT NULL CHECK(price > 0), mileage INTEGER NOT NULL CHECK(mileage >= 0), year INTEGER NOT NULL,
 fuel TEXT NOT NULL, gearbox TEXT NOT NULL, power INTEGER, city TEXT NOT NULL, description TEXT NOT NULL,
 serviceHistory INTEGER CHECK(serviceHistory IN (0,1)), accidentFree INTEGER CHECK(accidentFree IN (0,1)),
 source TEXT NOT NULL, externalId TEXT, isDemo INTEGER NOT NULL DEFAULT 0 CHECK(isDemo IN (0,1)),
 createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(source, externalId)
);
CREATE INDEX IF NOT EXISTS listing_search ON Listing(brand, model, price);
