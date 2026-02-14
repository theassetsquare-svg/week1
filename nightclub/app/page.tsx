import Link from "next/link";
import type { Metadata } from "next";
import { venues, regions, citiesByRegion } from "@/lib/venues";
import { regionSlug, citySlug } from "@/lib/venues";
import VenueCard from "@/components/VenueCard";
import AutoSlideGallery from "@/components/AutoSlideGallery";
import JsonLd from "@/components/JsonLd";
import { webSiteJsonLd, itemListJsonLd, faqJsonLd } from "@/lib/structuredData";

export const metadata: Metadata = {
  title: "전국나이트클럽 추천 | 지역별 인기 클럽 & 라운지 모음",
  description:
    "전국나이트클럽 정보를 한눈에 확인하세요. 지역별 인기 나이트, 클럽, 라운지 분위기와 추천 포인트 정리. 서울 강남 클럽, 홍대 라운지, 부산 나이트 등 프리미엄 나이트라이프 가이드.",
  keywords: [
    "전국나이트클럽",
    "전국 나이트 추천",
    "전국 클럽 추천",
    "전국 라운지 추천",
    "서울 나이트 핫플",
    "강남 클럽 추천",
    "홍대 라운지 분위기",
  ],
};

const HERO_IMAGES = [
  { src: "/images/party-confetti.jpg", alt: "전국나이트클럽 추천 파티 분위기" },
  { src: "/images/hero-1.jpg", alt: "전국나이트클럽 프리미엄 클럽 인테리어" },
  { src: "/images/dance-floor.jpg", alt: "전국나이트클럽 댄스플로어" },
  { src: "/images/hero-2.jpg", alt: "전국나이트클럽 VIP 라운지" },
  { src: "/images/vip-1.jpg", alt: "전국나이트클럽 프리미엄 서비스" },
];

const GALLERY_IMAGES = [
  "/images/party-1.jpg", "/images/dj-booth.jpg", "/images/party-confetti.jpg",
  "/images/dance-floor.jpg", "/images/club-interior.jpg", "/images/neon-party.jpg",
  "/images/concert-crowd.jpg", "/images/party-lights.jpg", "/images/hero-1.jpg",
  "/images/hero-2.jpg", "/images/vip-1.jpg", "/images/lounge-1.jpg",
];

function e(slug: string) {
  return "/club/" + encodeURIComponent(slug) + "/";
}

const FEATURED = [
  { slug: "강남레이스클럽", tag: "HOT" },
  { slug: "강남사운드클럽", tag: "NEW" },
  { slug: "하입라운지", tag: "VIP" },
  { slug: "이태원와이키키유토피아클럽", tag: "HOT" },
  { slug: "부산아시아드나이트", tag: "BEST" },
  { slug: "인트로라운지", tag: "VIP" },
];

const MAIN_FAQ = [
  { q: "전국나이트클럽 추천 어디가 좋나요?", a: "서울 강남의 레이스클럽, 사운드클럽, 압구정 하입라운지, 부산 아시아드나이트 등이 전국나이트클럽 중 가장 인기 있는 곳입니다. 지역별 분위기와 특징이 다르니, 목적에 맞는 곳을 선택하세요." },
  { q: "전국나이트클럽 드레스코드가 있나요?", a: "대부분의 전국나이트클럽은 세미캐주얼 이상의 복장을 권장합니다. 슬리퍼, 반바지, 트레이닝복은 입장이 제한될 수 있습니다." },
  { q: "전국나이트클럽 제휴문의는 어떻게 하나요?", a: "전국나이트클럽 제휴문의는 카카오톡 besta12로 연락해 주세요. 24시간 상담 가능합니다." },
  { q: "전국나이트클럽 중 초보자에게 추천하는 곳은?", a: "처음 방문하시는 분께는 분위기가 편안한 수원찬스돔나이트, 일산샴푸나이트, 인천아라비안나이트 등을 추천합니다. 웨이터 서비스가 잘 되어 있어 초보자도 편하게 즐길 수 있습니다." },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={webSiteJsonLd()} />
      <JsonLd data={itemListJsonLd(venues)} />
      <JsonLd data={faqJsonLd(MAIN_FAQ)} />

      {/* Block 1: Hero - Fullscreen Auto-slide */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <AutoSlideGallery images={HERO_IMAGES} interval={5000} height="h-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#050508] z-10" />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center px-4 max-w-5xl mx-auto pt-16">
            <p className="text-purple-400 text-sm md:text-base font-medium tracking-[0.4em] uppercase mb-6 animate-fade-up">
              Premium Nightlife Guide
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-6 leading-[1.1] animate-fade-up delay-100">
              <span className="gradient-text">전국나이트클럽</span>
              <br />
              <span className="text-white">추천</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
              서울 강남 클럽부터 부산 나이트까지<br className="hidden md:block" />
              전국나이트클럽 프리미엄 가이드
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
              <a
                href="#venues"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 text-sm tracking-wider"
              >
                전국나이트클럽 전체 보기
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
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float z-20">
          <div className="w-6 h-10 border-2 border-purple-400/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-purple-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Block 2: Gallery Strip */}
      <section className="py-2 bg-[#050508]">
        <div className="gallery-scroll px-2">
          {GALLERY_IMAGES.map((img, i) => (
            <div key={i} className="w-56 md:w-72 h-36 md:h-44 rounded-lg overflow-hidden">
              <img
                src={img}
                alt={`전국나이트클럽 프리미엄 분위기 ${i + 1}`}
                className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-500 img-zoom"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Block 3: Featured Venues */}
      <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">Featured</p>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="gradient-text">전국나이트클럽 인기 추천</span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            전국나이트클럽 중 지금 가장 핫한 곳을 소개합니다
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED.map((f, i) => {
            const v = venues.find((v) => v.slug === f.slug);
            if (!v) return null;
            return (
              <Link
                key={f.slug}
                href={e(f.slug)}
                className="group card-premium rounded-2xl overflow-hidden animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={GALLERY_IMAGES[i % GALLERY_IMAGES.length]}
                    alt={`${v.nameKo} 전국나이트클럽 추천`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 bg-purple-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">
                    {f.tag}
                  </span>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-purple-300 text-xs font-medium mb-1">{v.city}</p>
                    <h3 className="text-white text-xl font-bold">{v.nameKo}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{v.summary.replace(/7080\s*(음악\s*(부터|과|,)\s*)?/g, "").trim()}</p>
                  <div className="flex gap-2">
                    {v.themes.filter(t => t !== "7080" && t !== "소셜댄스").map((t) => (
                      <span key={t} className="text-[10px] border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Block 4: Atmosphere Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/dance-floor.jpg" alt="전국나이트클럽 댄스플로어 분위기" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-purple-950/80 to-[#050508]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6 text-white neon-text">
            전국나이트클럽<br />잊을 수 없는 밤
          </h2>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            전국나이트클럽에서 화려한 조명 아래, 최고의 사운드와 함께.
            프리미엄 VIP 서비스로 특별한 밤을 경험하세요.
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-black gradient-text">{venues.length}+</div>
              <div className="text-gray-500 text-xs mt-1">전국나이트클럽</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black gradient-text">{regions.length}</div>
              <div className="text-gray-500 text-xs mt-1">전국 지역</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black gradient-text">VIP</div>
              <div className="text-gray-500 text-xs mt-1">프리미엄 서비스</div>
            </div>
          </div>
        </div>
      </section>

      {/* Block 5: Region Section */}
      <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">By Region</p>
          <h2 className="text-3xl md:text-5xl font-black">
            <span className="gradient-text">전국나이트클럽 지역별 가이드</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {regions.map((r) => (
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

      {/* Block 6: Image Gallery Grid */}
      <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-2xl overflow-hidden">
          {GALLERY_IMAGES.slice(0, 8).map((img, i) => (
            <div key={i} className={`relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""} ${i === 5 ? "col-span-2" : ""}`}>
              <img
                src={img}
                alt={`전국나이트클럽 프리미엄 분위기 ${i + 1}`}
                className={`w-full object-cover img-zoom ${i === 0 ? "h-80 md:h-[500px]" : i === 5 ? "h-40 md:h-60" : "h-40 md:h-60"}`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Block 7: All Venues */}
      <section id="venues" className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">All Venues</p>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="gradient-text">전국나이트클럽 전체</span>
          </h2>
          <p className="text-gray-500">전국나이트클럽 {venues.length}곳 프리미엄 클럽 & 라운지</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((v, i) => (
            <VenueCard key={v.slug} venue={v} index={i} />
          ))}
        </div>
      </section>

      {/* Block 8: FAQ Section */}
      <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black gradient-text">전국나이트클럽 자주 묻는 질문</h2>
        </div>
        <div className="space-y-3">
          {MAIN_FAQ.map((faq, i) => (
            <details key={i} className="card-premium rounded-xl group">
              <summary className="p-5 cursor-pointer font-medium text-white hover:text-purple-300 transition-colors flex items-center justify-between">
                {faq.q}
                <svg className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Block 9: SEO Content */}
      <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="divider-glow mb-12" />
        <h2 className="text-2xl md:text-3xl font-black mb-8 gradient-text">전국나이트클럽 추천 가이드</h2>
        <div className="space-y-6 text-gray-500 leading-relaxed text-sm">
          <p>
            <strong className="text-gray-300">전국나이트클럽 추천</strong> — 전국나이트클럽 정보를 한눈에 확인하세요. 서울 강남의 <Link href={e("강남레이스클럽")} className="text-purple-400 hover:text-purple-300">강남레이스클럽</Link>, <Link href={e("강남사운드클럽")} className="text-purple-400 hover:text-purple-300">강남사운드클럽</Link> 등 대한민국을 대표하는 프리미엄 클럽이 모여 있습니다. 세계적인 DJ 라인업과 최첨단 사운드 시스템, VIP 부스 서비스까지. 전국나이트클럽의 중심은 강남입니다.
          </p>
          <p>
            <strong className="text-gray-300">전국 라운지 추천</strong> — 압구정 <Link href={e("하입라운지")} className="text-purple-400 hover:text-purple-300">하입라운지</Link>, <Link href={e("컬러라운지")} className="text-purple-400 hover:text-purple-300">컬러라운지</Link>, <Link href={e("인트로라운지")} className="text-purple-400 hover:text-purple-300">인트로라운지</Link>, <Link href={e("아르쥬라운지")} className="text-purple-400 hover:text-purple-300">아르쥬라운지</Link> 등 서울에서 가장 세련된 밤문화를 경험할 수 있는 곳입니다.
          </p>
          <p>
            <strong className="text-gray-300">전국 나이트 추천 (지방)</strong> — <Link href={e("부산아시아드나이트")} className="text-purple-400 hover:text-purple-300">부산아시아드나이트</Link>, <Link href={e("부산물나이트")} className="text-purple-400 hover:text-purple-300">부산물나이트</Link>, <Link href={e("대구바밤바나이트")} className="text-purple-400 hover:text-purple-300">대구바밤바나이트</Link> 등 전국나이트클럽 지방 대도시에서도 최고 수준의 나이트라이프를 즐길 수 있습니다.
          </p>
          <p>
            <strong className="text-gray-300">서울 나이트 핫플</strong> — 수유, 노원, 신림, 상봉 등 서울 곳곳에 위치한 전국나이트클럽에서 다양한 분위기와 음악을 경험해 보세요. 각 업소의 분위기와 특징을 비교하고 나만의 핫플을 찾아보세요.
          </p>
          <p>
            <strong className="text-gray-300">전국나이트클럽 제휴문의</strong> — 전국나이트클럽 제휴, VIP 예약, 단체 방문 상담은 카카오톡 besta12로 연락해 주세요. 24시간 상담 가능합니다.
          </p>
        </div>
      </section>
    </>
  );
}
