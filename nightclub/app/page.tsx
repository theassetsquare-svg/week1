import Link from "next/link";
import type { Metadata } from "next";
import { venues, allThemes, regions, citiesByRegion } from "@/lib/venues";
import { regionSlug, citySlug } from "@/lib/venues";
import VenueCard from "@/components/VenueCard";
import JsonLd from "@/components/JsonLd";
import { webSiteJsonLd, itemListJsonLd } from "@/lib/structuredData";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `전국 나이트클럽 정보 — 지역별·테마별 나이트클럽 검색 | ${SITE_NAME}`,
  description:
    "서울, 경기, 인천, 울산 등 전국 나이트클럽 위치·분위기·가격·드레스코드 정보를 한곳에서 비교하세요. 7080, 강남클럽, 소셜댄스 등 테마별 검색도 가능합니다.",
  openGraph: {
    title: "전국 나이트클럽 정보 — 지역별·테마별 나이트클럽 검색",
    description:
      "대한민국 전국 나이트클럽 정보 디렉터리. 방문 전 필요한 모든 정보를 확인하세요.",
  },
};

const THEME_ICONS: Record<string, string> = {
  "7080": "🎶",
  "소셜댄스": "💃",
  "강남": "✨",
  "클럽": "🎧",
  "라운지": "🍸",
};

const REGION_ICONS: Record<string, string> = {
  서울: "🏙️",
  경기: "🌳",
  인천: "⚓",
  경남: "🌊",
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={webSiteJsonLd()} />
      <JsonLd data={itemListJsonLd(venues)} />

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/party-confetti.jpg"
            alt="나이트클럽 파티 분위기"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/85 via-purple-900/80 to-pink-900/75" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center text-white">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-balance leading-tight drop-shadow-lg">
            전국 나이트클럽 정보
            <br />
            <span className="text-violet-200">한눈에 비교하고 방문하세요</span>
          </h1>
          <p className="text-lg md:text-xl text-violet-100 max-w-2xl mx-auto mb-8 drop-shadow">
            서울·경기·인천·부산·대구·울산 등 전국 나이트클럽의 위치, 분위기, 가격,
            드레스코드 정보를 한곳에서 확인하세요.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#all-clubs"
              className="bg-white text-violet-700 font-bold px-8 py-3 rounded-full hover:bg-violet-50 transition-colors shadow-lg"
            >
              전체 나이트클럽 보기 ↓
            </a>
          </div>
        </div>
      </section>

      {/* Party Photo Strip */}
      <section className="bg-black overflow-hidden">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {["/images/party-1.jpg", "/images/dj-booth.jpg", "/images/dance-floor.jpg", "/images/club-interior.jpg", "/images/neon-party.jpg", "/images/concert-crowd.jpg"].map((img, i) => (
            <div key={i} className="flex-shrink-0 w-48 md:w-64 h-32 md:h-40">
              <img
                src={img}
                alt={`나이트클럽 파티 분위기 ${i + 1}`}
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {/* Regions */}
        <section className="py-12">
          <h2 className="text-2xl font-bold mb-6">지역별 나이트클럽</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {regions.map((r) => (
              <Link
                key={r}
                href={
                  "/kr/" +
                  regionSlug(r) +
                  "/" +
                  citySlug(citiesByRegion[r]?.[0] || r) +
                  "/nightclubs/"
                }
                className="flex items-center gap-3 bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-violet-300 hover:shadow-md transition-all"
              >
                <span className="text-3xl">
                  {REGION_ICONS[r] || "📍"}
                </span>
                <div>
                  <div className="font-semibold">{r}</div>
                  <div className="text-sm text-gray-500">
                    {venues.filter((v) => v.region === r).length}개 클럽
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Themes */}
        <section className="py-8">
          <h2 className="text-2xl font-bold mb-6">테마별 나이트클럽</h2>
          <div className="flex flex-wrap gap-3">
            {allThemes.map((t) => (
              <Link
                key={t}
                href={"/theme/" + encodeURIComponent(t) + "/"}
                className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-5 py-2.5 rounded-full font-medium hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
              >
                <span>{THEME_ICONS[t] || "🎵"}</span>
                {t}
                <span className="text-xs text-violet-400">
                  ({venues.filter((v) => v.themes.includes(t as string)).length})
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* All Clubs */}
        <section id="all-clubs" className="py-12">
          <h2 className="text-2xl font-bold mb-2">
            전체 나이트클럽 목록{" "}
            <span className="text-violet-500 text-lg font-normal">
              ({venues.length}곳)
            </span>
          </h2>
          <p className="text-gray-500 mb-6">
            클릭하면 상세 정보 페이지로 이동합니다.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <VenueCard key={v.slug} venue={v} />
            ))}
          </div>
        </section>

        {/* Party CTA Banner */}
        <section className="py-8">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src="/images/party-lights.jpg"
              alt="나이트클럽 파티"
              className="w-full h-56 md:h-72 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 to-pink-900/60 flex items-center">
              <div className="px-8 md:px-12">
                <h3 className="text-white text-2xl md:text-3xl font-extrabold mb-3">
                  지금 바로 예약하세요
                </h3>
                <p className="text-violet-200 mb-4 text-sm md:text-base max-w-lg">
                  전국 27개 업소의 웨이터/MD 연락처를 확인하고 최고의 밤을 즐기세요.
                  부스, 룸, VIP 테이블 예약이 가능합니다.
                </p>
                <a
                  href="#all-clubs"
                  className="inline-block bg-white text-violet-700 font-bold px-6 py-2.5 rounded-full hover:bg-violet-50 transition-colors text-sm"
                >
                  업소 둘러보기
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content */}
        <section className="py-12 prose dark:prose-invert max-w-none">
          <h2>전국 나이트클럽 방문 가이드</h2>
          <p>
            대한민국 전국의 나이트클럽 정보를 한곳에 모았습니다. 서울 강남, 홍대 지역의
            프리미엄 클럽부터 수원, 일산, 파주, 인천, 울산 등 전국 각지의 7080
            소셜댄스 나이트클럽까지 — 지역별, 테마별로 쉽게 비교하고 선택하세요.
          </p>
          <h3>나이트클럽 방문 전 확인해야 할 것</h3>
          <ul>
            <li>
              <strong>영업시간:</strong> 대부분의 나이트클럽은 금·토요일 21:00~03:00에 운영됩니다.
            </li>
            <li>
              <strong>드레스코드:</strong> 업장마다 다르지만, 깔끔한 세미캐주얼 이상을 권장합니다.
            </li>
            <li>
              <strong>예산:</strong> 입장료 + 음료 기준 2.5~8만원 수준이며, 지역과 업장에 따라 차이가 있습니다.
            </li>
            <li>
              <strong>주차:</strong> 업장별 주차 가능 여부를 사전에 확인하세요.
            </li>
          </ul>
          <h3>인기 지역</h3>
          <p>
            서울(강남·홍대·상봉), 경기(수원·일산·파주·안양), 인천, 울산 등이
            나이트클럽 방문 인기 지역입니다. 각 지역 허브 페이지에서 해당 지역의
            모든 나이트클럽을 한눈에 비교할 수 있습니다.
          </p>
        </section>
      </div>
    </>
  );
}
