import type { Metadata } from "next";
import { venues, cityFromSlug, citySlug } from "@/lib/venues";
import { canonical } from "@/lib/site";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import VenueCard from "@/components/VenueCard";

const GUIDE_CITIES = ["seoul", "suwon", "goyang", "incheon", "ulsan", "anyang", "paju"];

export function generateStaticParams() {
  return GUIDE_CITIES.map((c) => ({ city: c }));
}

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityKo = cityFromSlug(city) || city;
  const title = `${cityKo} 나이트클럽 초보 가이드 — 처음 방문 전 꼭 읽어야 할 정보`;
  const description = `${cityKo} 나이트클럽 처음 가시나요? 복장, 분위기, 에티켓, 시간대별 팁까지 초보자를 위한 완벽 가이드. 제휴문의 카톡 besta12`;

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: canonical(`/guide/${city}/first-time/`) },
  };
}

export default async function FirstTimeGuidePage({ params }: Props) {
  const { city } = await params;
  const cityKo = cityFromSlug(city) || city;

  const cityVenues = venues.filter(
    (v) => citySlug(v.city) === city && v.beginnerFriendly
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: canonical("/") },
          { name: "가이드", url: canonical("/") },
          {
            name: `${cityKo} 초보 가이드`,
            url: canonical(`/guide/${city}/first-time/`),
          },
        ])}
      />

      {/* Hero */}
      <section className="relative h-[50vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/lounge-2.jpg" alt={`${cityKo} 나이트클럽 가이드`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 pb-10 w-full">
          <Breadcrumb
            items={[
              { label: "홈", href: "/" },
              { label: "가이드" },
              { label: `${cityKo} 나이트 초보 가이드` },
            ]}
          />
          <h1 className="text-3xl md:text-5xl font-black mt-4 animate-fade-up">
            <span className="gradient-text">{cityKo} 나이트클럽</span>
            <br />
            <span className="text-white">처음이라면 꼭 읽으세요</span>
          </h1>
          <p className="text-gray-400 mt-3 max-w-2xl animate-fade-up delay-100">
            {cityKo} 지역 나이트클럽에 처음 방문하시나요? 복장부터 분위기, 에티켓까지 초보자가 알아야 할 모든 것을 정리했습니다.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
        <div className="space-y-10">
          <section>
            <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">Dress Code</p>
            <h2 className="text-xl font-black text-white mb-4">복장 (드레스코드)</h2>
            <div className="card-premium rounded-2xl p-6">
              <p className="text-gray-400 mb-4">
                대부분의 나이트클럽은 <strong className="text-white">세미캐주얼 이상</strong>의 복장을 권장합니다. 슬리퍼, 반바지, 트레이닝복은 입장이 제한될 수 있습니다.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-900/20 border border-green-500/10 rounded-xl p-4">
                  <div className="font-bold text-green-400 mb-2">추천</div>
                  <ul className="space-y-1.5 text-gray-400">
                    <li>깔끔한 셔츠/블라우스</li>
                    <li>슬랙스/청바지 (깔끔한)</li>
                    <li>구두/단화/깔끔한 운동화</li>
                  </ul>
                </div>
                <div className="bg-red-900/20 border border-red-500/10 rounded-xl p-4">
                  <div className="font-bold text-red-400 mb-2">비추천</div>
                  <ul className="space-y-1.5 text-gray-400">
                    <li>슬리퍼/쪼리</li>
                    <li>반바지/트레이닝복</li>
                    <li>과도한 캐주얼</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">Best Time</p>
            <h2 className="text-xl font-black text-white mb-4">추천 방문 시간</h2>
            <div className="card-premium rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="bg-blue-900/20 border border-blue-500/10 rounded-xl p-4">
                  <div className="font-bold text-blue-400">21:00~22:00</div>
                  <div className="text-gray-500 mt-1">오픈 직후 — 여유롭게</div>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/10 rounded-xl p-4">
                  <div className="font-bold text-purple-400">22:00~00:00</div>
                  <div className="text-gray-500 mt-1">피크 시작 — 분위기 UP</div>
                </div>
                <div className="bg-pink-900/20 border border-pink-500/10 rounded-xl p-4">
                  <div className="font-bold text-pink-400">00:00~02:00</div>
                  <div className="text-gray-500 mt-1">피크타임 — 가장 핫한 시간</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                초보자라면 오픈 직후에 도착해서 분위기에 적응하는 것을 추천합니다.
              </p>
            </div>
          </section>

          <section>
            <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">Etiquette</p>
            <h2 className="text-xl font-black text-white mb-4">에티켓</h2>
            <div className="space-y-3">
              {[
                "다른 이용객을 존중하고 예의 바르게 행동하세요.",
                "과도한 음주는 본인과 주변 사람 모두에게 불쾌할 수 있습니다.",
                "사진/영상 촬영은 상대방의 동의를 받으세요.",
                "안전을 위해 귀가 교통편을 미리 확보해두세요.",
                "분실물 주의 — 소지품은 최소한으로 가져가세요.",
              ].map((tip, i) => (
                <div key={i} className="card-premium rounded-xl p-4 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-gray-400 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* City Venues */}
        {cityVenues.length > 0 && (
          <section className="mt-16">
            <p className="text-purple-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">
              Recommended
            </p>
            <h2 className="text-xl font-black text-white mb-6">
              {cityKo} 초보 추천 나이트클럽
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {cityVenues.map((v, i) => (
                <VenueCard key={v.slug} venue={v} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-16 text-center">
          <div className="card-premium rounded-3xl p-10 md:p-14">
            <h3 className="text-2xl font-black mb-3 gradient-text">제휴문의</h3>
            <p className="text-gray-500 mb-6">나이트클럽 관련 문의는 카카오톡으로 연락해 주세요</p>
            <a
              href="https://open.kakao.com/o/sbesta12"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-3 rounded-full neon-glow hover:scale-105 transition-all"
            >
              카카오톡 besta12
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
