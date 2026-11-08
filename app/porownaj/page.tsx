import { Comparison } from "@/components/comparison";
import { listings } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = { title: "Porównywarka" };
export default async function Compare() {
  return <Comparison cars={await listings.all()} />;
}
