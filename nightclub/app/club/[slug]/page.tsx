import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { venues, getVenueBySlug, regionSlug, citySlug } from "@/lib/venues";
import { canonical, SITE_NAME } from "@/lib/site";
import { localBusinessJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { getVenueSeoTitle, getVenueSeoDescription } from "@/lib/seoMeta";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import VenueCard from "@/components/VenueCard";
import AutoSlideGallery from "@/components/AutoSlideGallery";

export function generateStaticParams() {
  return venues.map((v) => ({ slug: v.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(decodeURIComponent(slug));
  if (!venue) return {};

  const n = venue.nameKo;
  const title = getVenueSeoTitle(n);
  const description = getVenueSeoDescription(n);

  return {
    title,
    description,
    keywords: [
      n,
      `${n} 분위기`,
      `${n} 후기`,
      `${n} 위치`,
      `${n} 드레스코드`,
      `${venue.city} 나이트클럽`,
      `${venue.city} 클럽 추천`,
      `${venue.region} 나이트`,
    ],
    openGraph: {
      title,
      description,
      url: canonical("/club/" + encodeURIComponent(slug) + "/"),
      type: "website",
      images: [{ url: "/images/party-confetti.jpg", width: 1200, height: 630 }],
    },
    alternates: {
      canonical: canonical("/club/" + encodeURIComponent(slug) + "/"),
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
  return Array.from({ length: 8 }, (_, i) => ALL_IMAGES[(start + i) % ALL_IMAGES.length]);
}

function clean(s: string) {
  return s.replace(/7080\s*(음악\s*(부터|과|,)\s*)?/g, "").replace(/\s{2,}/g, " ").trim();
}

const pricePhonePattern = /\d{2,4}-\d{3,4}-\d{4}|원[~)]|원$|₩|\d{1,3}(,\d{3})+원|만원|입장료|MD\s|예약문의:|대표전화:/;

export default async function ClubDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(decodeURIComponent(slug));
  if (!venue) notFound();

  const n = venue.nameKo;
  const images = getVenueImages(slug);
  const galleryImages = images.slice(0, 6).map((src, i) => ({
    src,
    alt: `${n} 나이트클럽 분위기 ${i + 1}`,
  }));

  const similar = venues
    .filter(
      (v) =>
        v.slug !== venue.slug &&
        (v.region === venue.region || v.themes.some((t) => venue.themes.includes(t)))
    )
    .slice(0, 3);

  const regionS = regionSlug(venue.region);
  const cityS = citySlug(venue.city);
  const cityRegion = venue.city === venue.region ? venue.city : `${venue.city} ${venue.region}`;
  const displayThemes = venue.themes.filter((t) => t !== "7080" && t !== "소셜댄스");
  const cleanSummary = clean(venue.summary);
  const displayGenres = venue.genres.filter((g) => g !== "7080");

  const displayTips = venue.tips.filter((t) => !pricePhonePattern.test(t));
  const fallbackTips = [
    `${n}은(는) ${venue.city}에서 분위기 좋은 나이트클럽으로 유명합니다.`,
    `영업시간은 ${venue.operatingHours || "금·토 21:00~03:00"}이며, 피크타임은 ${venue.peakTime || "23:00~01:00"}입니다.`,
    "드레스코드를 준수하면 더 좋은 경험을 하실 수 있습니다.",
    "주말에는 일찍 방문하시면 여유롭게 즐길 수 있습니다.",
    "제휴문의는 카카오톡 besta12로 연락해 주세요.",
  ];
  const tips = displayTips.length >= 3 ? displayTips.slice(0, 5) : fallbackTips;

  const faqItems = [
    {
      q: `${n} 분위기는 어떤가요?`,
      a: `${n}은(는) ${cityRegion}에 위치한 프리미엄 나이트클럽입니다. ${cleanSummary} ${venue.beginnerFriendly ? `${n}은(는) 초보 방문객도 편하게 즐길 수 있는 분위기입니다.` : `${n}은(는) 세련된 분위기로 사전에 분위기를 파악하고 방문하시는 것을 추천합니다.`}`,
    },
    {
      q: `${n} 드레스코드가 있나요?`,
      a: `${n}의 드레스코드는 ${venue.dressCode || "세미캐주얼"}입니다. ${n} 방문 시 슬리퍼, 반바지 등 과도하게 캐주얼한 복장은 피하시고, 깔끔한 캐주얼 이상의 복장을 권장합니다.`,
    },
    {
      q: `${n} 영업시간은 어떻게 되나요?`,
      a: `${n}의 영업시간은 ${venue.operatingHours || "금·토 21:00~03:00"}입니다. ${n}의 피크타임은 ${venue.peakTime || "23:00~01:00"}이며, 처음 방문하시는 분은 오픈 직후에 도착하시는 것을 추천합니다.`,
    },
    {
      q: `${n} 주차가 가능한가요?`,
      a: venue.parking
        ? `${n}에는 주차 공간이 있습니다. 다만 주말에는 일찍 차는 경우가 있으니, ${n} 방문 시 여유 있게 도착하시거나 대중교통 이용을 권장합니다.`
        : `${n}에는 전용 주차장이 없습니다. ${n} 방문 시 인근 공영주차장이나 대중교통을 이용하시기 바랍니다.`,
    },
    {
      q: `${n} 예약 및 제휴문의는 어떻게 하나요?`,
      a: `${n} 관련 제휴문의, VIP 예약, 단체 방문 상담은 카카오톡 besta12로 연락해 주세요. ${n} 관련 24시간 상담 가능합니다.`,
    },
  ];

  return (
    <>
      <JsonLd data={localBusinessJsonLd(venue)} />
      <JsonLd data={faqJsonLd(faqItems)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: canonical("/") },
          {
            name: venue.region + " 나이트클럽",
            url: canonical("/kr/" + regionS + "/" + cityS + "/nightclubs/"),
          },
          { name: n, url: canonical("/club/" + encodeURIComponent(venue.slug) + "/") },
        ])}
      />

      {/* Block 1: Hero - Auto Slide Gallery */}
      <section className="relative h-[70vh] md:h-[80vh] flex items-end overflow-hidden">
        <AutoSlideGallery images={galleryImages} interval={4000} height="h-[70vh] md:h-[80vh]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/20 to-transparent z-10" />
        <div className="relative z-20 max-w-5xl mx-auto px-4 md:px-8 pb-12 md:pb-16 w-full">
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: "홈", href: "/" },
                { label: venue.region, href: "/kr/" + regionS + "/" + cityS + "/nightclubs/" },
                { label: n },
              ]}
            />
          </div>
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3 animate-fade-up">
            {cityRegion}
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 animate-fade-up delay-100">
            <span className="gradient-text">{n}</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl leading-relaxed animate-fade-up delay-200">
            {cleanSummary}
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

      {/* Block 2: Photo Gallery Strip */}
      <section className="py-3 bg-[#050508]">
        <div className="gallery-scroll px-2">
          {images.map((img, i) => (
            <div key={i} className="w-48 md:w-64 h-32 md:h-40 rounded-lg overflow-hidden">
              <img
                src={img}
                alt={`${n} 나이트클럽 분위기 ${i + 1}`}
                className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-500 img-zoom"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-24">

        {/* Block 3: Info Cards Row */}
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

        {/* Block 4: About / Story Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            About
          </p>
          <h2 className="text-2xl md:text-4xl font-black mb-8">
            <span className="gradient-text">{n}</span>
            <span className="text-white"> 소개</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p className="text-lg text-gray-300">
                <strong className="text-white">{n}</strong>은(는) {cityRegion}에 위치한 프리미엄 나이트라이프 공간입니다.
                {n}은(는) {venue.address}에 자리하고 있습니다.
              </p>
              <p>
                {cleanSummary} {displayGenres.length > 0 && `${n}에서는 ${displayGenres.join(", ")} 등 다양한 장르의 음악을 즐기실 수 있습니다.`}
              </p>
              <p>
                {n}의 영업시간은 {venue.operatingHours || "금·토 21:00~03:00"}이며,
                피크타임은 {venue.peakTime || "23:00~01:00"}입니다.
                {venue.beginnerFriendly && ` ${n}은(는) 처음 방문하시는 분도 편안하게 즐기실 수 있는 분위기입니다.`}
              </p>
              <p>
                {n} 방문을 계획하신다면, 드레스코드({venue.dressCode || "세미캐주얼"})를 참고하시고
                최고의 사운드 시스템과 화려한 조명 아래 잊을 수 없는 밤을 경험해 보세요.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={images[1]}
                alt={`${n} 나이트클럽 인테리어`}
                className="w-full h-64 md:h-80 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15]/60 to-transparent" />
            </div>
          </div>
        </section>

        {/* Block 5: Feature Highlights */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            Highlights
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-8">
            <span className="gradient-text">{n}</span>
            <span className="text-white"> 특징</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card-premium rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-2">음악 & 사운드</h3>
              <p className="text-gray-500 text-sm">
                {n}에서는 {displayGenres.length > 0 ? displayGenres.join(", ") : "다양한 장르"} 음악을 최고의 사운드 시스템으로 즐기실 수 있습니다.
              </p>
            </div>
            <div className="card-premium rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-2">분위기 & 인테리어</h3>
              <p className="text-gray-500 text-sm">
                화려한 조명과 세련된 인테리어로 {n}만의 프리미엄 분위기를 만들어 냅니다.
              </p>
            </div>
            <div className="card-premium rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-2">서비스</h3>
              <p className="text-gray-500 text-sm">
                {n}의 전문 스태프가 최상의 서비스로 특별한 밤을 만들어 드립니다.
                {venue.beginnerFriendly && " 초보자 친화적인 서비스로 편안한 방문이 가능합니다."}
              </p>
            </div>
          </div>
        </section>

        {/* Block 6: Photo Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 rounded-2xl overflow-hidden">
            {images.slice(0, 6).map((img, i) => (
              <div
                key={i}
                className={`relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}
              >
                <img
                  src={img}
                  alt={`${n} 나이트클럽 분위기 ${i + 1}`}
                  className={`w-full object-cover img-zoom ${i === 0 ? "h-64 md:h-96" : "h-32 md:h-48"}`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </section>

        {/* Block 7: Location Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            Location
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            <span className="gradient-text">{n}</span>
            <span className="text-white"> 찾아오시는 길</span>
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
                <div className="text-white font-bold text-lg mb-1">{n}</div>
                <div className="text-gray-400">{venue.address}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={"https://map.naver.com/v5/search/" + encodeURIComponent(n)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 font-medium px-5 py-2.5 rounded-full text-sm hover:bg-green-600/30 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                네이버 지도
              </a>
              <a
                href={"https://map.kakao.com/?q=" + encodeURIComponent(n)}
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

        {/* Block 8: Tips Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            Tips
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            <span className="gradient-text">{n}</span>
            <span className="text-white"> 방문 팁</span>
          </h2>
          <div className="space-y-3">
            {tips.map((tip, i) => (
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

        {/* Block 9: Atmosphere Banner */}
        <section className="relative rounded-3xl overflow-hidden mb-16">
          <img
            src={images[2]}
            alt={`${n} 파티 분위기`}
            className="w-full h-56 md:h-72 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/80 via-purple-950/50 to-transparent flex items-center">
            <div className="px-8 md:px-12">
              <h3 className="text-2xl md:text-4xl font-black text-white neon-text mb-3">
                {n}에서의 특별한 밤
              </h3>
              <p className="text-purple-200 text-sm md:text-base max-w-md">
                {n}에서 잊을 수 없는 순간을 만들어 보세요.
                화려한 조명과 최고의 사운드가 기다리고 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Block 10: FAQ Section */}
        <section className="mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            <span className="gradient-text">{n}</span>
            <span className="text-white"> 자주 묻는 질문</span>
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, i) => (
              <details key={i} className="card-premium rounded-xl group">
                <summary className="p-5 cursor-pointer font-medium text-white hover:text-purple-300 transition-colors flex items-center justify-between">
                  {faq.q}
                  <svg className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Block 11: CTA Section */}
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
              <span className="gradient-text">{n} 제휴문의</span>
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {n} 관련 문의나 제휴 상담을 원하시면 카카오톡으로 연락해 주세요
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

        {/* Block 12: Similar Venues */}
        {similar.length > 0 && (
          <section className="mb-16">
            <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
              Similar
            </p>
            <h2 className="text-2xl md:text-3xl font-black mb-8">
              <span className="gradient-text">{n}</span>
              <span className="text-white">과(와) 비슷한 분위기</span>
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {similar.map((v, i) => (
                <VenueCard key={v.slug} venue={v} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Block 13: SEO Content */}
        <section className="mb-8">
          <div className="divider-glow mb-10" />
          <h2 className="text-xl font-bold mb-6 gradient-text">
            {n} 방문 가이드
          </h2>
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              <strong className="text-gray-400">{n}</strong>은(는) {venue.address}에 위치한 {cityRegion} 지역의 대표 나이트클럽입니다. {cleanSummary}
            </p>
            <p>
              {n}을(를) 처음 방문하시는 분이라면, {n}의 드레스코드({venue.dressCode || "세미캐주얼"})를 참고하시고,
              피크타임({venue.peakTime || "23:00~01:00"}) 전에 도착하시는 것을 추천합니다.
              {n}의 영업시간은 {venue.operatingHours || "금·토 21:00~03:00"}입니다.
            </p>
            <p>
              {displayGenres.length > 0 && `${n}에서는 ${displayGenres.join(", ")} 등 다양한 장르의 음악을 즐기실 수 있습니다. `}
              {n}은(는) {venue.city} 나이트클럽을 찾는 분들에게 항상 추천되는 곳입니다.
              {n}만의 프리미엄 분위기와 최고의 서비스를 직접 경험해 보세요.
            </p>
            <p>
              {n} 관련 제휴문의, VIP 예약, 단체 방문 상담은 카카오톡 besta12로 연락해 주세요. 24시간 상담 가능합니다.
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
