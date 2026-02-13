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
  const title = `${cityKo} 나이트클럽 추천 — ${regionKo} 지역 클럽·나이트·라운지 정보`;
  const description = `${cityKo} 나이트클럽, ${cityKo} 클럽, ${cityKo} 나이트 추천. ${regionKo} 지역 프리미엄 클럽 & 라운지 분위기, 위치, 방문 가이드를 확인하세요. 제휴문의 카톡 besta12`;

  return {
    title,
    description,
    keywords: [
      `${cityKo} 나이트`,
      `${cityKo} 클럽`,
      `${cityKo} 나이트클럽`,
      `${cityKo} 클럽 추천`,
      `${regionKo} 나이트`,
      `${regionKo} 클럽`,
    ],
    openGraph: { title, description },
    alternates: {
      canonical: canonical(`/kr/${region}/${city}/nightclubs/`),
    },
  };
}

const HERO_IMAGES = [
  "/images/party-confetti.jpg",
  "/images/dance-floor.jpg",
  "/images/hero-1.jpg",
  "/images/club-interior.jpg",
  "/images/party-lights.jpg",
  "/images/hero-2.jpg",
];

export default async function CityNightclubsPage({ params }: Props) {
  const { region, city } = await params;
  const regionKo = regionFromSlug(region) || region;
  const cityKo = cityFromSlug(city) || city;

  const cityVenues = venues.filter(
    (v) => v.region === regionKo || v.city === cityKo
  );

  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = ((hash << 5) - hash + city.charCodeAt(i)) | 0;
  }
  const heroImg = HERO_IMAGES[Math.abs(hash) % HERO_IMAGES.length];

  return (
    <>
      <JsonLd data={itemListJsonLd(cityVenues)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: canonical("/") },
          { name: regionKo, url: canonical(`/kr/${region}/${city}/nightclubs/`) },
          { name: `${cityKo} 나이트클럽`, url: canonical(`/kr/${region}/${city}/nightclubs/`) },
        ])}
      />

      {/* Hero */}
      <section className="relative h-[50vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={`${cityKo} 나이트클럽 분위기`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pb-10 w-full">
          <Breadcrumb
            items={[
              { label: "홈", href: "/" },
              { label: regionKo },
              { label: `${cityKo} 나이트클럽` },
            ]}
          />
          <h1 className="text-3xl md:text-5xl font-black mt-4 animate-fade-up">
            <span className="gradient-text">{cityKo}</span>{" "}
            <span className="text-white">나이트클럽</span>
          </h1>
          <p className="text-gray-400 mt-3 animate-fade-up delay-100">
            {cityKo} 지역 프리미엄 나이트클럽 {cityVenues.length}곳
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cityVenues.map((v, i) => (
            <VenueCard key={v.slug} venue={v} index={i} />
          ))}
        </div>

        {cityVenues.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">아직 등록된 나이트클럽이 없습니다.</p>
            <p>곧 업데이트 예정입니다.</p>
          </div>
        )}

        {/* SEO content */}
        <section className="mt-20">
          <div className="divider-glow mb-10" />
          <h2 className="text-xl font-bold mb-4 gradient-text">
            {cityKo} 나이트클럽 & 클럽 추천 가이드
          </h2>
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              {cityKo} 지역에는 다양한 컨셉의 프리미엄 나이트클럽이 있습니다. 최신 EDM 클럽부터 라운지까지, 방문 목적과 취향에 맞는 나이트클럽을 찾아보세요.
            </p>
            <p>
              {cityKo} 나이트, {cityKo} 클럽 추천, {regionKo} 나이트클럽 정보를 한눈에 확인하실 수 있습니다. 제휴문의는 카카오톡 besta12로 연락해 주세요.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
