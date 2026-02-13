import type { Metadata } from "next";
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

  const title = `${venue.city} ${venue.nameKo} — 분위기·위치·방문 가이드`;
  const description = `${venue.city} ${venue.nameKo} 완벽 가이드. ${venue.address} | ${venue.summary} | 영업시간: ${venue.operatingHours || "금·토 21:00~03:00"} | 드레스코드: ${venue.dressCode || "세미캐주얼"} | 제휴문의 카톡 besta12`;

  return {
    title,
    description,
    keywords: [
      `${venue.city} 나이트`,
      `${venue.city} 클럽`,
      `${venue.nameKo}`,
      `${venue.city} 나이트클럽`,
      `${venue.region} 나이트`,
      `${venue.region} 클럽 추천`,
      "나이트클럽 추천",
      "클럽 분위기",
    ],
    openGraph: {
      title,
      description,
      url: canonical("/club/" + slug + "/"),
      type: "website",
      images: [{ url: "/images/party-confetti.jpg", width: 1200, height: 630 }],
    },
    alternates: {
      canonical: canonical("/club/" + slug + "/"),
    },
  };
}

const ALL_IMAGES = [
  "/images/party-1.jpg",
  "/images/dj-booth.jpg",
  "/images/party-confetti.jpg",
  "/images/party-lights.jpg",
  "/images/dance-floor.jpg",
  "/images/concert-crowd.jpg",
  "/images/club-interior.jpg",
  "/images/neon-party.jpg",
  "/images/hero-1.jpg",
  "/images/hero-2.jpg",
  "/images/vip-1.jpg",
  "/images/vip-2.jpg",
  "/images/lounge-1.jpg",
  "/images/lounge-2.jpg",
  "/images/gallery-1.jpg",
  "/images/gallery-2.jpg",
  "/images/gallery-3.jpg",
  "/images/gallery-4.jpg",
  "/images/gallery-5.jpg",
  "/images/neon-bg.jpg",
];

function getVenueImages(slug: string): string[] {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  const start = Math.abs(hash) % ALL_IMAGES.length;
  return Array.from({ length: 6 }, (_, i) => ALL_IMAGES[(start + i) % ALL_IMAGES.length]);
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
  const displayThemes = venue.themes.filter((t) => t !== "7080" && t !== "소셜댄스");

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

      {/* Hero Section - Full width immersive */}
      <section className="relative h-[70vh] md:h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={images[0]}
            alt={`${venue.city} ${venue.nameKo} 나이트클럽 분위기`}
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pb-12 md:pb-16 w-full">
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: "홈", href: "/" },
                { label: venue.region, href: "/kr/" + regionS + "/" + cityS + "/nightclubs/" },
                { label: venue.nameKo },
              ]}
            />
          </div>
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3 animate-fade-up">
            {venue.city} · {venue.region}
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 animate-fade-up delay-100">
            <span className="gradient-text">{venue.city}</span>{" "}
            <span className="text-white">{venue.nameKo}</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl leading-relaxed animate-fade-up delay-200">
            {venue.summary}
          </p>
          <div className="flex flex-wrap gap-2 mt-6 animate-fade-up delay-300">
            {displayThemes.map((t) => (
              <span
                key={t}
                className="border border-purple-500/30 text-purple-300 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
            {venue.parking && (
              <span className="border border-cyan-500/30 text-cyan-300 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                주차가능
              </span>
            )}
            {venue.beginnerFriendly && (
              <span className="border border-green-500/30 text-green-300 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                초보추천
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Photo Gallery Strip */}
      <section className="py-3 bg-[#050508]">
        <div className="gallery-scroll px-2">
          {images.map((img, i) => (
            <div key={i} className="w-48 md:w-64 h-32 md:h-40 rounded-lg overflow-hidden">
              <img
                src={img}
                alt={`${venue.nameKo} 나이트클럽 분위기 ${i + 1}`}
                className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-500 img-zoom"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-24">

        {/* Info Cards Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-16 animate-fade-up">
          <div className="card-premium rounded-2xl p-5 text-center">
            <div className="text-purple-400 text-xs font-medium tracking-wider uppercase mb-2">영업시간</div>
            <div className="text-white font-bold text-sm">
              {venue.operatingHours || "금·토 21:00~03:00"}
            </div>
          </div>
          <div className="card-premium rounded-2xl p-5 text-center">
            <div className="text-purple-400 text-xs font-medium tracking-wider uppercase mb-2">드레스코드</div>
            <div className="text-white font-bold text-sm">
              {venue.dressCode || "세미캐주얼"}
            </div>
          </div>
          <div className="card-premium rounded-2xl p-5 text-center">
            <div className="text-purple-400 text-xs font-medium tracking-wider uppercase mb-2">피크타임</div>
            <div className="text-white font-bold text-sm">
              {venue.peakTime || "23:00~01:00"}
            </div>
          </div>
          <div className="card-premium rounded-2xl p-5 text-center">
            <div className="text-purple-400 text-xs font-medium tracking-wider uppercase mb-2">주차</div>
            <div className="text-white font-bold text-sm">
              {venue.parking ? "가능" : "인근 공영주차장"}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            About
          </p>
          <h2 className="text-2xl md:text-4xl font-black mb-8">
            <span className="gradient-text">{venue.nameKo}</span>
            <span className="text-white">의 매력</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p className="text-lg text-gray-300">
                {venue.city}에 위치한 <strong className="text-white">{venue.nameKo}</strong>은(는) {venue.region} 지역을 대표하는 프리미엄 나이트라이프 공간입니다.
              </p>
              <p>
                {venue.summary} {venue.genres.length > 0 && `${venue.genres.join(", ")} 등 다양한 장르의 음악을 즐기실 수 있습니다.`}
              </p>
              <p>
                최고의 사운드 시스템과 화려한 조명 아래, 잊을 수 없는 밤을 경험해 보세요.
                {venue.beginnerFriendly && " 처음 방문하시는 분도 편안하게 즐기실 수 있는 분위기입니다."}
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={images[1]}
                alt={`${venue.nameKo} 나이트클럽 인테리어`}
                className="w-full h-64 md:h-80 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15]/60 to-transparent" />
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            Location
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            <span className="text-white">찾아오시는 길</span>
          </h2>
          <div className="card-premium rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg mb-1">{venue.nameKo}</div>
                <div className="text-gray-400">{venue.address}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={"https://map.naver.com/v5/search/" + encodeURIComponent(venue.nameKo)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 font-medium px-5 py-2.5 rounded-full text-sm hover:bg-green-600/30 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                네이버 지도
              </a>
              <a
                href={"https://map.kakao.com/?q=" + encodeURIComponent(venue.nameKo)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-600/20 text-yellow-400 font-medium px-5 py-2.5 rounded-full text-sm hover:bg-yellow-600/30 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                카카오맵
              </a>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            Tips
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            <span className="text-white">방문 전 알아두면 좋은 팁</span>
          </h2>
          <div className="space-y-3">
            {venue.tips.slice(0, 5).map((tip, i) => (
              <div
                key={i}
                className="card-premium rounded-xl p-5 flex gap-4 items-start animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Atmosphere Image Banner */}
        <section className="relative rounded-3xl overflow-hidden mb-16">
          <img
            src={images[2]}
            alt={`${venue.nameKo} 파티 분위기`}
            className="w-full h-56 md:h-72 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/80 via-purple-950/50 to-transparent flex items-center">
            <div className="px-8 md:px-12">
              <h3 className="text-2xl md:text-4xl font-black text-white neon-text mb-3">
                잊을 수 없는 밤
              </h3>
              <p className="text-purple-200 text-sm md:text-base max-w-md">
                {venue.nameKo}에서 특별한 순간을 만들어 보세요.
                화려한 조명과 최고의 사운드가 기다리고 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            <span className="text-white">자주 묻는 질문</span>
          </h2>
          <div className="space-y-3">
            <details className="card-premium rounded-xl group">
              <summary className="p-5 cursor-pointer font-medium text-white hover:text-purple-300 transition-colors flex items-center justify-between">
                {venue.nameKo} 드레스코드가 있나요?
                <svg className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                {venue.dressCode || "세미캐주얼"}입니다. 슬리퍼, 반바지 등 과도하게 캐주얼한 복장은 피하는 것이 좋습니다. 깔끔한 캐주얼 이상의 복장을 권장합니다.
              </div>
            </details>
            <details className="card-premium rounded-xl group">
              <summary className="p-5 cursor-pointer font-medium text-white hover:text-purple-300 transition-colors flex items-center justify-between">
                {venue.nameKo} 주차가 가능한가요?
                <svg className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                {venue.parking
                  ? "주차 공간이 있습니다. 다만 주말에는 일찍 차는 경우가 있으니, 여유 있게 도착하시거나 대중교통 이용을 권장합니다."
                  : "전용 주차장이 없습니다. 인근 공영주차장이나 대중교통을 이용하시기 바랍니다."}
              </div>
            </details>
            <details className="card-premium rounded-xl group">
              <summary className="p-5 cursor-pointer font-medium text-white hover:text-purple-300 transition-colors flex items-center justify-between">
                처음 가는데 분위기가 어떤가요?
                <svg className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                {venue.summary}{" "}
                {venue.beginnerFriendly
                  ? "초보 방문객도 편하게 즐길 수 있는 분위기입니다."
                  : "첫 방문이라면 사전에 분위기를 파악하고 가시는 것을 추천합니다."}
              </div>
            </details>
            <details className="card-premium rounded-xl group">
              <summary className="p-5 cursor-pointer font-medium text-white hover:text-purple-300 transition-colors flex items-center justify-between">
                {venue.nameKo} 영업시간은 어떻게 되나요?
                <svg className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                {venue.operatingHours || "금·토 21:00~03:00"} 영업합니다. 피크타임은 {venue.peakTime || "23:00~01:00"}이며, 처음 방문하시는 분은 오픈 직후에 도착하시는 것을 추천합니다.
              </div>
            </details>
            <details className="card-premium rounded-xl group">
              <summary className="p-5 cursor-pointer font-medium text-white hover:text-purple-300 transition-colors flex items-center justify-between">
                제휴문의나 예약은 어떻게 하나요?
                <svg className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                제휴문의 및 예약은 카카오톡 <strong className="text-purple-300">besta12</strong>로 연락해 주세요. 24시간 상담 가능합니다.
              </div>
            </details>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative rounded-3xl overflow-hidden mb-16">
          <div className="absolute inset-0">
            <img
              src={images[3]}
              alt="프리미엄 나이트라이프"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/80 via-purple-950/80 to-[#050508]/80" />
          </div>
          <div className="relative py-16 md:py-20 text-center px-4">
            <h3 className="text-3xl md:text-4xl font-black mb-4">
              <span className="gradient-text">제휴문의</span>
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {venue.nameKo} 관련 문의나 제휴 상담을 원하시면 카카오톡으로 연락해 주세요
            </p>
            <a
              href="https://open.kakao.com/o/sbesta12"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-lg md:text-xl font-black px-10 md:px-14 py-4 md:py-5 rounded-full neon-glow hover:scale-105 transition-all duration-300"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.5 3 2 6.58 2 11c0 2.83 1.82 5.32 4.56 6.73-.2.73-.72 2.65-.83 3.06-.13.5.18.5.38.36.16-.1 2.46-1.67 3.44-2.35.48.07.96.1 1.45.1 5.5 0 10-3.58 10-8s-4.5-7.9-10-7.9z" />
              </svg>
              카카오톡 besta12
            </a>
            <p className="text-purple-400/60 text-sm mt-4">24시간 상담 가능</p>
          </div>
        </section>

        {/* Photo Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 rounded-2xl overflow-hidden">
            {images.slice(0, 6).map((img, i) => (
              <div
                key={i}
                className={`relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}
              >
                <img
                  src={img}
                  alt={`${venue.nameKo} 나이트클럽 분위기 ${i + 1}`}
                  className={`w-full object-cover img-zoom ${i === 0 ? "h-64 md:h-96" : "h-32 md:h-48"}`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </section>

        {/* Similar Venues */}
        {similar.length > 0 && (
          <section className="mb-16">
            <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
              Similar
            </p>
            <h2 className="text-2xl md:text-3xl font-black mb-8">
              <span className="gradient-text">비슷한 분위기</span>
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {similar.map((v, i) => (
                <VenueCard key={v.slug} venue={v} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* SEO Content */}
        <section className="mb-8">
          <div className="divider-glow mb-10" />
          <h2 className="text-xl font-bold mb-4 gradient-text">
            {venue.city} {venue.nameKo} 방문 가이드
          </h2>
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              <strong className="text-gray-400">{venue.city} {venue.nameKo}</strong>은(는) {venue.address}에 위치한 {venue.region} 지역의 대표 나이트클럽입니다. {venue.summary}
            </p>
            <p>
              {venue.city} 나이트클럽을 찾고 계신 분, {venue.city} 클럽 추천이 필요하신 분, {venue.region} 나이트 핫플을 알고 싶으신 분께 {venue.nameKo}을(를) 추천합니다.
              영업시간은 {venue.operatingHours || "금·토 21:00~03:00"}이며, 드레스코드는 {venue.dressCode || "세미캐주얼"}입니다.
            </p>
            <p>
              {venue.nameKo} 관련 제휴문의, VIP 예약, 단체 방문 상담은 카카오톡 besta12로 연락해 주세요. 24시간 상담 가능합니다.
            </p>
          </div>
        </section>

        {/* Verified */}
        <div className="text-xs text-gray-700 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
          마지막 검증일: {venue.lastVerifiedAt}
        </div>
      </div>
    </>
  );
}
