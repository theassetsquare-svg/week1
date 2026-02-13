import type { Metadata } from "next";
import Link from "next/link";
import { venues, cityFromSlug, citySlug, regionSlug } from "@/lib/venues";
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
  const description = `${cityKo} 나이트클럽에 처음 가시나요? 복장, 예산, 분위기, 에티켓, 시간대별 팁까지 초보자를 위한 완벽 가이드입니다.`;

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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "가이드" },
            { label: `${cityKo} 나이트 초보 가이드` },
          ]}
        />

        <h1 className="text-3xl font-extrabold mb-4">
          {cityKo} 나이트클럽, 처음이라면 꼭 읽으세요
        </h1>
        <p className="text-gray-500 mb-10 text-lg">
          {cityKo} 지역 나이트클럽에 처음 방문하시나요? 복장부터 예산, 분위기,
          에티켓까지 — 초보자가 알아야 할 모든 것을 정리했습니다.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">👔</span> 복장 (드레스코드)
            </h2>
            <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <p className="mb-3">
                대부분의 나이트클럽은 <strong>세미캐주얼 이상</strong>의 복장을
                권장합니다. 슬리퍼, 반바지, 트레이닝복은 입장이 제한될 수 있습니다.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="font-semibold text-green-700 dark:text-green-400 mb-1">
                    ✅ 추천
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>깔끔한 셔츠/블라우스</li>
                    <li>슬랙스/청바지 (깔끔한)</li>
                    <li>구두/단화/깔끔한 운동화</li>
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="font-semibold text-red-700 dark:text-red-400 mb-1">
                    ❌ 비추천
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>슬리퍼/쪼리</li>
                    <li>반바지/트레이닝복</li>
                    <li>과도한 캐주얼</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">💰</span> 예산
            </h2>
            <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <p className="mb-3">
                일반적인 7080 나이트클럽은 <strong>₩25,000~₩50,000</strong>,
                강남 프리미엄 클럽은 <strong>₩40,000~₩80,000</strong> 수준입니다
                (입장료+음료 기준).
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                💡 팁: 테이블 예약 시 최소 주류 주문이 필요한 곳도 있으니, 예산을 넉넉히 준비하세요.
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">⏰</span> 추천 방문 시간
            </h2>
            <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="font-bold text-blue-700 dark:text-blue-400">
                    21:00~22:00
                  </div>
                  <div className="text-gray-500 mt-1">오픈 직후 — 여유롭게</div>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
                  <div className="font-bold text-violet-700 dark:text-violet-400">
                    22:00~00:00
                  </div>
                  <div className="text-gray-500 mt-1">
                    피크 시작 — 분위기 UP
                  </div>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
                  <div className="font-bold text-pink-700 dark:text-pink-400">
                    00:00~02:00
                  </div>
                  <div className="text-gray-500 mt-1">
                    피크타임 — 가장 핫한 시간
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                초보자라면 오픈 직후에 도착해서 분위기에 적응하는 것을 추천합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">📋</span> 에티켓
            </h2>
            <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-2 text-sm">
              <p>• 다른 이용객을 존중하고 예의 바르게 행동하세요.</p>
              <p>• 과도한 음주는 본인과 주변 사람 모두에게 불쾌할 수 있습니다.</p>
              <p>• 사진/영상 촬영은 상대방의 동의를 받으세요.</p>
              <p>• 안전을 위해 귀가 교통편을 미리 확보해두세요.</p>
              <p>• 분실물 주의 — 소지품은 최소한으로 가져가세요.</p>
            </div>
          </section>
        </div>

        {/* City Venues */}
        {cityVenues.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">
              {cityKo} 초보 추천 나이트클럽
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {cityVenues.map((v) => (
                <VenueCard key={v.slug} venue={v} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
