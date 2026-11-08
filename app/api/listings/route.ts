import { listings } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await listings.all());
  } catch {
    return Response.json(
      { error: "Baza danych jest niedostępna. Uruchom npm run db:setup." },
      { status: 503 },
    );
  }
}
