import { listings } from "@/lib/db";
import { Catalog } from "@/components/search";
export const dynamic = "force-dynamic";
export default async function Home() {
  const cars = await listings.all();
  return <Catalog cars={cars} />;
}
