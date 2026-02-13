import { redirect } from "next/navigation";
import { getAllCities, regionSlug, citySlug } from "@/lib/venues";

export function generateStaticParams() {
  return getAllCities().map((c) => ({
    region: regionSlug(c.region),
    city: citySlug(c.city),
  }));
}

type Props = { params: Promise<{ region: string; city: string }> };

export default async function CityPage({ params }: Props) {
  const { region, city } = await params;
  redirect(`/kr/${region}/${city}/nightclubs/`);
}
