import Link from "next/link";
import type { Metadata } from "next";
import { venues, regions, citiesByRegion } from "@/lib/venues";
import { regionSlug, citySlug } from "@/lib/venues";
import VenueCard from "@/components/VenueCard";
import JsonLd from "@/components/JsonLd";
import { webSiteJsonLd, itemListJsonLd } from "@/lib/structuredData";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `강남 클럽 추천 | 서울 나이트 핫플 | 홍대 라운지 — ${SITE_NAME}`,
  description:
    "강남 클럽 추천, 서울 나이트 핫플, 홍대 라운지 분위기, 이태원 클럽 정보. 전국 프리미엄 나이트클럽 & 라운지를 한눈에. VIP 부스 예약, 분위기 후기, 추천 포인트까지.",
};

const GALLERY_IMAGES = [
  "/images/party-1.jpg",
  "/images/dj-booth.jpg",
  "/images/party-confetti.jpg",
  "/images/dance-floor.jpg",
  "/images/club-interior.jpg",
  "/images/neon-party.jpg",
  "/images/concert-crowd.jpg",
  "/images/party-lights.jpg",
];

const FEATURED = [
  { slug: "gangnam-race", label: "강남 레이스클럽", region: "강남", tag: "HOT" },
  { slug: "gangnam-sound", label: "강남 사운드클럽", region: "강남", tag: "NEW" },
  { slug: "hype-lounge", label: "압구정 하입라운지", region: "압구정", tag: "VIP" },
  { slug: "itaewon-waikiki", label: "이태원 와이키키클럽", region: "이태원", tag: "HOT" },
  { slug: "busan-asiad", label: "부산 아시아드나이트", region: "부산", tag: "BEST" },
  { slug: "intro-lounge", label: "압구정 인트로라운지", region: "압구정", tag: "VIP" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={webSiteJsonLd()} />
      <JsonLd data={itemListJsonLd(venues)} />

      {/* Hero - Fullscreen */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/party-confetti.jpg"
            alt="서울 강남 클럽 나이트 파티 분위기"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#050508]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-16">
          <p className="text-purple-400 text-sm md:text-base font-medium tracking-[0.4em] uppercase mb-6 animate-fade-up">
            Premium Nightlife Guide
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-6 leading-[1.1] animate-fade-up delay-100">
            <span className="gradient-text">당신의 밤을</span>
            <br />
            <span className="text-white">특별하게</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            서울 강남 클럽부터 부산 나이트까지<br className="hidden md:block" />
            대한민국 프리미엄 나이트라이프의 모든 것
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <a
              href="#venues"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 text-sm tracking-wider"
            >
              전체 업소 보기
            </a>
            <a
              href="https://open.kakao.com/o/sbesta12"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-purple-500/30 text-purple-300 font-bold px-8 py-4 rounded-full hover:bg-purple-500/10 transition-all duration-300 text-sm tracking-wider"
            >
              제휴문의 카톡 besta12
            </a>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-purple-400/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-purple-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Gallery Strip */}
      <section className="py-2 bg-[#050508]">
        <div className="gallery-scroll px-2">
          {GALLERY_IMAGES.map((img, i) => (
            <div key={i} className="w-56 md:w-72 h-36 md:h-44 rounded-lg overflow-hidden">
              <img
                src={img}
                alt={`프리미엄 클럽 파티 분위기 ${i + 1}`}
                className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-500 img-zoom"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Venues */}
      <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            Featured
          </p>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="gradient-text">지금 가장 핫한 곳</span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            서울 강남 클럽, 압구정 라운지, 부산 나이트 등 전국 최고의 핫플을 소개합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED.map((f, i) => {
            const v = venues.find((v) => v.slug === f.slug);
            if (!v) return null;
            return (
              <Link
                key={f.slug}
                href={"/club/" + f.slug + "/"}
                className="group card-premium rounded-2xl overflow-hidden animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={GALLERY_IMAGES[i % GALLERY_IMAGES.length]}
                    alt={`${f.region} ${v.nameKo} 나이트클럽 분위기`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 bg-purple-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">
                    {f.tag}
                  </span>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-purple-300 text-xs font-medium mb-1">{f.region}</p>
                    <h3 className="text-white text-xl font-bold">{v.nameKo}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{v.summary}</p>
                  <div className="flex gap-2">
                    {v.themes.filter(t => t !== "7080" && t !== "소셜댄스").map((t) => (
                      <span key={t} className="text-[10px] border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Atmosphere Section - Full width image */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/dance-floor.jpg"
            alt="나이트클럽 댄스플로어 분위기"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-purple-950/80 to-[#050508]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6 text-white neon-text">
            잊을 수 없는 밤이<br />시작되는 곳
          </h2>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            화려한 조명 아래, 최고의 DJ 사운드와 함께.
            프리미엄 VIP 라운지에서 특별한 밤을 경험하세요.
            당신만의 특별한 순간이 여기서 시작됩니다.
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-black gradient-text">27+</div>
              <div className="text-gray-500 text-xs mt-1">프리미엄 업소</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black gradient-text">7</div>
              <div className="text-gray-500 text-xs mt-1">전국 지역</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black gradient-text">VIP</div>
              <div className="text-gray-500 text-xs mt-1">프리미엄 서비스</div>
            </div>
          </div>
        </div>
      </section>

      {/* Region Section */}
      <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            By Region
          </p>
          <h2 className="text-3xl md:text-5xl font-black">
            <span className="gradient-text">지역별 나이트라이프</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {regions.map((r, i) => (
            <Link
              key={r}
              href={"/kr/" + regionSlug(r) + "/" + citySlug(citiesByRegion[r]?.[0] || r) + "/nightclubs/"}
              className="card-premium rounded-2xl p-6 md:p-8 text-center group"
            >
              <div className="text-3xl md:text-4xl font-black gradient-text mb-2">
                {venues.filter((v) => v.region === r).length}
              </div>
              <div className="text-white font-bold text-lg mb-1">{r}</div>
              <div className="text-gray-600 text-xs">
                {r === "서울" ? "강남 · 이태원 · 압구정" :
                 r === "경기" ? "수원 · 일산 · 성남" :
                 r === "부산" ? "동래 · 연산" :
                 r === "인천" ? "계양" :
                 r === "대구" ? "달서" :
                 r === "충남" ? "천안" : ""}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Image Gallery Grid */}
      <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-2xl overflow-hidden">
          {GALLERY_IMAGES.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""} ${i === 5 ? "col-span-2" : ""}`}
            >
              <img
                src={img}
                alt={`서울 나이트 클럽 라운지 파티 ${i + 1}`}
                className={`w-full object-cover img-zoom ${i === 0 ? "h-80 md:h-[500px]" : i === 5 ? "h-40 md:h-60" : "h-40 md:h-60"}`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* All Venues */}
      <section id="venues" className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
            All Venues
          </p>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="gradient-text">전체 업소</span>
          </h2>
          <p className="text-gray-500">
            전국 {venues.length}개 프리미엄 클럽 & 라운지
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((v, i) => (
            <VenueCard key={v.slug} venue={v} index={i} />
          ))}
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="divider-glow mb-12" />
        <h2 className="text-2xl md:text-3xl font-black mb-8 gradient-text">
          서울 나이트 & 강남 클럽 추천 가이드
        </h2>
        <div className="space-y-6 text-gray-500 leading-relaxed text-sm">
          <p>
            <strong className="text-gray-300">강남 클럽 추천</strong> — 서울 강남에는 레이스클럽, 사운드클럽 등 대한민국을 대표하는 프리미엄 클럽이 모여 있습니다.
            세계적인 DJ 라인업과 최첨단 사운드 시스템, 그리고 VIP 부스 서비스까지. 강남 클럽은 대한민국 나이트라이프의 중심입니다.
          </p>
          <p>
            <strong className="text-gray-300">홍대 라운지 분위기</strong> — 트렌디하고 자유로운 분위기의 홍대·이태원 지역에는 와이키키유토피아클럽을 비롯한 개성 있는 클럽과 라운지가 있습니다.
          </p>
          <p>
            <strong className="text-gray-300">압구정 라운지</strong> — 하입라운지, 컬러라운지, 인트로라운지, 아르쥬라운지 등 압구정 로데오 라운지 클러스터는 서울에서 가장 세련된 밤문화를 경험할 수 있는 곳입니다.
          </p>
          <p>
            <strong className="text-gray-300">부산 나이트 & 대구 클럽</strong> — 부산 아시아드나이트, 물나이트, 대구 바밤바나이트 등 지방 대도시에서도 최고 수준의 나이트라이프를 즐길 수 있습니다.
          </p>
          <p>
            <strong className="text-gray-300">서울 나이트 핫플</strong> — 수유, 노원, 신림, 상봉 등 서울 곳곳에 위치한 나이트클럽에서 다양한 분위기와 음악을 경험해 보세요.
            각 업소의 분위기와 특징을 비교하고 나만의 핫플을 찾아보세요.
          </p>
        </div>
      </section>
    </>
  );
}
