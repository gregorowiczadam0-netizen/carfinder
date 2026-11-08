import { parseImport, type ImportedListing } from "./import";
/** Adaptery nie wykonują pobierania bez jawnej integracji i potwierdzenia uprawnień. */
export interface ListingSource<T> {
  readonly name: string;
  readonly authorization: "user-upload" | "licensed";
  normalize(input: T): Promise<ImportedListing[]>;
}
export class CsvSource implements ListingSource<string> {
  readonly name = "csv";
  readonly authorization = "user-upload" as const;
  async normalize(input: string) {
    const result = parseImport(input);
    if (result.errors.length) throw new Error(result.errors.join("\n"));
    return result.rows;
  }
}
