import type { Metadata } from "next";
import {
  venues,
  getAllCities,
  regionSlug,
  citySlug,
  regionFromSlug,
  cityFromSlug,
} from "@/lib/venues";
import { canonical, SITE_NAME } from "@/lib/site";
import VenueCard from "@/components/VenueCard";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import { itemListJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";

export function generateStaticParams() {
  return getAllCities().map((c) => ({
    region: regionSlug(c.region),
    city: citySlug(c.city),
  }));
}

type Props = { params: Promise<{ region: string; city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, city } = await params;
  const regionKo = regionFromSlug(region) || region;
  const cityKo = cityFromSlug(city) || city;
  const title = `${cityKo} 나이트클럽 목록 — ${regionKo} 지역 나이트클럽 정보`;
  const description = `${cityKo} 지역 나이트클럽 전체 목록입니다. 위치, 가격, 분위기, 드레스코드를 비교하고 방문 전 필요한 정보를 확인하세요.`;

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: {
      canonical: canonical(`/kr/${region}/${city}/nightclubs/`),
    },
  };
}

export default async function CityNightclubsPage({ params }: Props) {
  const { region, city } = await params;
  const regionKo = regionFromSlug(region) || region;
  const cityKo = cityFromSlug(city) || city;

  const cityVenues = venues.filter(
    (v) => v.region === regionKo || v.city === cityKo
  );

  return (
    <>
      <JsonLd data={itemListJsonLd(cityVenues)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: canonical("/") },
          {
            name: regionKo,
            url: canonical(`/kr/${region}/${city}/nightclubs/`),
          },
          {
            name: `${cityKo} 나이트클럽`,
            url: canonical(`/kr/${region}/${city}/nightclubs/`),
          },
        ])}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: regionKo },
            { label: `${cityKo} 나이트클럽` },
          ]}
        />

        <h1 className="text-3xl font-extrabold mb-2">
          {cityKo} 나이트클럽 목록
        </h1>
        <p className="text-gray-500 mb-8">
          {cityKo} 지역의 나이트클럽 {cityVenues.length}곳을 한눈에 비교하세요.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cityVenues.map((v) => (
            <VenueCard key={v.slug} venue={v} />
          ))}
        </div>

        {cityVenues.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">아직 등록된 나이트클럽이 없습니다.</p>
            <p>곧 업데이트 예정입니다.</p>
          </div>
        )}

        {/* SEO content */}
        <section className="mt-12 prose dark:prose-invert max-w-none">
          <h2>{cityKo} 나이트클럽 방문 가이드</h2>
          <p>
            {cityKo} 지역에는 다양한 컨셉의 나이트클럽이 있습니다.
            7080 소셜댄스부터 최신 EDM 클럽까지, 방문 목적과 취향에 맞는
            나이트클럽을 찾아보세요. 각 업장의 위치, 가격, 분위기, 드레스코드
            정보를 상세 페이지에서 확인할 수 있습니다.
          </p>
        </section>
      </div>
    </>
  );
}
