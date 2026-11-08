import { listings } from "@/lib/db";
import { Catalog } from "@/components/search";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ulubione" };
export default async function Favorites() {
  return <Catalog cars={await listings.all()} favoritesOnly />;
}
