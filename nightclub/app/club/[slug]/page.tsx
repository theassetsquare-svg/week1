import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { venues, getVenueBySlug, regionSlug, citySlug } from "@/lib/venues";
import { canonical, SITE_NAME } from "@/lib/site";
import { nightClubJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import VenueCard from "@/components/VenueCard";

export function generateStaticParams() {
  return venues.map((v) => ({ slug: v.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return {};

  const title = `${venue.nameKo} — 위치·가격·분위기·방문 가이드`;
  const description = `${venue.nameKo} ${venue.address} | ${venue.summary} | 영업시간: ${venue.operatingHours || "금·토 21:00~03:00"} | 예상 비용: ${venue.priceMin ? "₩" + venue.priceMin.toLocaleString() + "~" : "문의"} | 드레스코드: ${venue.dressCode || "세미캐주얼"}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical("/club/" + slug + "/"),
      type: "website",
    },
    alternates: {
      canonical: canonical("/club/" + slug + "/"),
    },
  };
}

const PARTY_IMAGES = [
  "/images/party-1.jpg",
  "/images/dj-booth.jpg",
  "/images/party-confetti.jpg",
  "/images/party-lights.jpg",
  "/images/dance-floor.jpg",
  "/images/concert-crowd.jpg",
  "/images/club-interior.jpg",
  "/images/neon-party.jpg",
];

function getVenueImages(slug: string): string[] {
  // Deterministic image selection based on slug
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  const start = Math.abs(hash) % PARTY_IMAGES.length;
  return [
    PARTY_IMAGES[start % PARTY_IMAGES.length],
    PARTY_IMAGES[(start + 1) % PARTY_IMAGES.length],
    PARTY_IMAGES[(start + 2) % PARTY_IMAGES.length],
    PARTY_IMAGES[(start + 3) % PARTY_IMAGES.length],
  ];
}

export default async function ClubDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) notFound();

  const images = getVenueImages(slug);

  const similar = venues
    .filter(
      (v) =>
        v.slug !== venue.slug &&
        (v.region === venue.region ||
          v.themes.some((t) => venue.themes.includes(t)))
    )
    .slice(0, 3);

  const regionS = regionSlug(venue.region);
  const cityS = citySlug(venue.city);

  return (
    <>
      <JsonLd data={nightClubJsonLd(venue)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: canonical("/") },
          {
            name: venue.region + " 나이트클럽",
            url: canonical("/kr/" + regionS + "/" + cityS + "/nightclubs/"),
          },
          { name: venue.nameKo, url: canonical("/club/" + venue.slug + "/") },
        ])}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            {
              label: venue.region,
              href: "/kr/" + regionS + "/" + cityS + "/nightclubs/",
            },
            { label: venue.nameKo },
          ]}
        />

        {/* Photo Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 rounded-2xl overflow-hidden">
          {images.map((img, i) => (
            <div key={i} className={`relative ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
              <img
                src={img}
                alt={`${venue.nameKo} 나이트클럽 파티 분위기 ${i + 1}`}
                className="w-full h-full object-cover aspect-square"
                loading={i === 0 ? "eager" : "lazy"}
              />
              {i === 0 && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              )}
            </div>
          ))}
        </div>

        {/* Hero Section - 1st Screen */}
        <div className="bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl p-6 md:p-8 mb-8">
          <h1 className="text-2xl md:text-4xl font-extrabold mb-3">
            {venue.nameKo}
          </h1>
          <p className="text-violet-100 mb-4">{venue.address}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs text-violet-200 mb-1">영업시간</div>
              <div className="font-semibold text-sm">
                {venue.operatingHours || "금·토 21:00~03:00"}
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs text-violet-200 mb-1">예상 비용</div>
              <div className="font-semibold text-sm">
                {venue.priceMin
                  ? `₩${(venue.priceMin / 10000).toFixed(0)}만~${venue.priceMax ? (venue.priceMax / 10000).toFixed(0) + "만" : ""}`
                  : "전화 문의"}
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs text-violet-200 mb-1">드레스코드</div>
              <div className="font-semibold text-sm">
                {venue.dressCode || "세미캐주얼"}
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-xs text-violet-200 mb-1">피크타임</div>
              <div className="font-semibold text-sm">
                {venue.peakTime || "23:00~01:00"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {venue.themes.map((t) => (
              <span
                key={t}
                className="text-xs bg-white/20 px-3 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
            {venue.parking && (
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                🅿️ 주차가능
              </span>
            )}
            {venue.beginnerFriendly && (
              <span className="text-xs bg-green-400/30 px-3 py-1 rounded-full">
                초보추천
              </span>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            {venue.phone && (
              <a
                href={"tel:" + venue.phone}
                className="bg-white text-violet-700 font-bold px-5 py-2 rounded-full text-sm hover:bg-violet-50 transition"
              >
                📞 전화문의 {venue.phone}
              </a>
            )}
            {venue.kakao && (
              <a
                href={"https://open.kakao.com/o/s" + venue.kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-400 text-gray-900 font-bold px-5 py-2 rounded-full text-sm hover:bg-yellow-300 transition"
              >
                💬 카카오톡 문의
              </a>
            )}
            <a
              href={
                "https://map.naver.com/v5/search/" +
                encodeURIComponent(venue.nameKo)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 text-white font-medium px-5 py-2 rounded-full text-sm hover:bg-white/30 transition"
            >
              🗺️ 네이버 지도
            </a>
            <a
              href={
                "https://map.kakao.com/?q=" +
                encodeURIComponent(venue.nameKo)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 text-white font-medium px-5 py-2 rounded-full text-sm hover:bg-white/30 transition"
            >
              🗺️ 카카오맵
            </a>
          </div>
        </div>

        {/* Verified Date */}
        <div className="text-sm text-gray-500 mb-8 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          마지막 검증일: {venue.lastVerifiedAt}
        </div>

        {/* 5줄 요약 for beginners */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">
            🔰 처음 가는 사람을 위한 5줄 요약
          </h2>
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-5 space-y-2">
            {venue.tips.slice(0, 5).map((tip, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-violet-500 font-bold shrink-0">
                  {i + 1}.
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">📍 상세 정보</h2>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex justify-between p-4">
              <span className="text-gray-500">주소</span>
              <span className="font-medium">{venue.address}</span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-gray-500">영업시간</span>
              <span className="font-medium">
                {venue.operatingHours || "금·토 21:00~03:00"}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-gray-500">예상 비용</span>
              <span className="font-medium">
                {venue.priceMin
                  ? `₩${venue.priceMin.toLocaleString()}~₩${venue.priceMax?.toLocaleString() || ""}`
                  : "전화 문의"}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-gray-500">드레스코드</span>
              <span className="font-medium">
                {venue.dressCode || "세미캐주얼"}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-gray-500">주차</span>
              <span className="font-medium">
                {venue.parking ? "가능" : "불가 (인근 공영주차장 이용)"}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-gray-500">장르</span>
              <span className="font-medium">{venue.genres.join(", ")}</span>
            </div>
            {venue.phone && (
              <div className="flex justify-between p-4">
                <span className="text-gray-500">전화</span>
                <a
                  href={"tel:" + venue.phone}
                  className="font-medium text-violet-600"
                >
                  {venue.phone}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Party Atmosphere Banner */}
        <section className="mb-10">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={PARTY_IMAGES[(Math.abs(slug.charCodeAt(0)) + 4) % PARTY_IMAGES.length]}
              alt={`${venue.nameKo} 나이트클럽 분위기`}
              className="w-full h-48 md:h-64 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 to-pink-900/60 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <p className="text-2xl md:text-3xl font-extrabold mb-2">
                  {venue.nameKo}
                </p>
                <p className="text-violet-200 text-sm md:text-base">
                  최고의 파티를 즐기세요
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">❓ 자주 묻는 질문 (FAQ)</h2>
          <div className="space-y-3">
            <details className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl">
              <summary className="p-4 cursor-pointer font-medium hover:text-violet-600">
                {venue.nameKo} 입장료는 얼마인가요?
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                {venue.priceMin
                  ? `예상 비용은 ₩${venue.priceMin.toLocaleString()}~₩${venue.priceMax?.toLocaleString() || ""} 수준입니다 (입장료+음료 기준). 실제 가격은 방문 시 확인하시기 바랍니다.`
                  : "정확한 입장료는 업장에 직접 문의하시기 바랍니다."}
              </div>
            </details>
            <details className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl">
              <summary className="p-4 cursor-pointer font-medium hover:text-violet-600">
                {venue.nameKo} 드레스코드가 있나요?
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                {venue.dressCode || "세미캐주얼"}입니다.
                슬리퍼, 반바지 등 과도하게 캐주얼한 복장은 피하는 것이 좋습니다.
              </div>
            </details>
            <details className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl">
              <summary className="p-4 cursor-pointer font-medium hover:text-violet-600">
                {venue.nameKo} 주차가 가능한가요?
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                {venue.parking
                  ? "주차 공간이 있습니다. 다만 주말에는 일찍 차는 경우가 있으니, 여유 있게 도착하시거나 대중교통 이용을 권장합니다."
                  : "전용 주차장이 없습니다. 인근 공영주차장이나 대중교통을 이용하시기 바랍니다."}
              </div>
            </details>
            <details className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl">
              <summary className="p-4 cursor-pointer font-medium hover:text-violet-600">
                처음 가는데 분위기가 어떤가요?
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                {venue.summary}{" "}
                {venue.beginnerFriendly
                  ? "초보 방문객도 편하게 즐길 수 있는 분위기입니다."
                  : "첫 방문이라면 사전에 분위기를 파악하고 가시는 것을 추천합니다."}
              </div>
            </details>
          </div>
        </section>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">
              🔗 비슷한 분위기의 나이트클럽
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {similar.map((v) => (
                <VenueCard key={v.slug} venue={v} />
              ))}
            </div>
          </section>
        )}

        {/* Legacy links */}
        {venue.legacyPaths && venue.legacyPaths.length > 0 && (
          <section className="mb-10 text-sm text-gray-400">
            <p>
              관련 상세 페이지:{" "}
              {venue.legacyPaths.map((lp, i) => (
                <span key={lp}>
                  {i > 0 && ", "}
                  <a
                    href={lp}
                    className="underline hover:text-violet-500"
                    target="_blank"
                    rel="noopener"
                  >
                    {lp}
                  </a>
                </span>
              ))}
            </p>
          </section>
        )}
      </div>
    </>
  );
}
