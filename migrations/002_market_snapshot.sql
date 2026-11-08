CREATE TABLE MarketSnapshot (
 id TEXT PRIMARY KEY, snapshotDate TEXT NOT NULL, market TEXT NOT NULL, currency TEXT NOT NULL,
 scope TEXT NOT NULL, scenario TEXT NOT NULL, fileHash TEXT NOT NULL
);
CREATE TABLE ModelProfile (
 id TEXT PRIMARY KEY, sourceModelId TEXT NOT NULL, snapshotId TEXT NOT NULL REFERENCES MarketSnapshot(id),
 brand TEXT NOT NULL, model TEXT NOT NULL, data TEXT NOT NULL,
 UNIQUE(snapshotId, sourceModelId)
);
-- SQLite wymaga przebudowy tabeli, aby dopuścić NULL. Wszystkie dotychczasowe rekordy są kopiowane.
CREATE TABLE Listing_next (
 id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL UNIQUE,
 brand TEXT NOT NULL, model TEXT NOT NULL, trim TEXT NOT NULL DEFAULT '', body TEXT,
 price INTEGER NOT NULL CHECK(price > 0), mileage INTEGER NOT NULL CHECK(mileage >= 0), year INTEGER NOT NULL,
 fuel TEXT, gearbox TEXT, power INTEGER, city TEXT, engine TEXT, description TEXT NOT NULL,
 serviceHistory INTEGER CHECK(serviceHistory IN (0,1)), accidentFree INTEGER CHECK(accidentFree IN (0,1)),
 source TEXT NOT NULL, externalId TEXT, isDemo INTEGER NOT NULL DEFAULT 0 CHECK(isDemo IN (0,1)),
 sourceUrl TEXT, snapshotDate TEXT, modelProfileId TEXT REFERENCES ModelProfile(id),
 createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(source, externalId)
);
INSERT INTO Listing_next (id,fingerprint,brand,model,trim,body,price,mileage,year,fuel,gearbox,power,city,description,serviceHistory,accidentFree,source,externalId,isDemo,createdAt)
 SELECT id,fingerprint,brand,model,trim,body,price,mileage,year,fuel,gearbox,power,city,description,serviceHistory,accidentFree,source,externalId,isDemo,createdAt FROM Listing;
DROP TABLE Listing;
ALTER TABLE Listing_next RENAME TO Listing;
CREATE INDEX listing_search ON Listing(brand,model,price);
CREATE INDEX listing_profile ON Listing(modelProfileId);
