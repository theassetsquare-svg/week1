import type { Metadata } from "next";
import { venues, allThemes, getVenuesByTheme } from "@/lib/venues";
import { canonical } from "@/lib/site";
import VenueCard from "@/components/VenueCard";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import { itemListJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";

export function generateStaticParams() {
  return allThemes.map((t) => ({ theme: t }));
}

type Props = { params: Promise<{ theme: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { theme } = await params;
  const decoded = decodeURIComponent(theme);
  const title = `${decoded} 나이트클럽 추천 — 테마별 전국 클럽·나이트·라운지`;
  const description = `${decoded} 테마의 전국 프리미엄 나이트클럽 & 라운지. ${decoded} 분위기를 즐길 수 있는 클럽의 분위기, 위치 정보를 확인하세요. 제휴문의 카톡 besta12`;

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: {
      canonical: canonical(`/theme/${encodeURIComponent(decoded)}/`),
    },
  };
}

const HERO_IMAGES = [
  "/images/party-confetti.jpg",
  "/images/neon-party.jpg",
  "/images/hero-2.jpg",
  "/images/lounge-1.jpg",
  "/images/vip-1.jpg",
];

const THEME_DESC: Record<string, string> = {
  강남: "강남 지역의 프리미엄 나이트클럽입니다. 세련된 인테리어와 하이엔드 분위기가 특징이며, 최고 수준의 클러빙 문화를 이끌고 있습니다.",
  클럽: "EDM, 힙합 등 최신 음악을 중심으로 한 클럽입니다. 대규모 사운드 시스템과 화려한 조명으로 몰입감 있는 파티를 즐길 수 있습니다.",
  라운지: "라운지 바 / 라운지 클럽은 대화가 가능한 분위기에서 음료를 즐길 수 있는 공간입니다. 세련되고 조용한 분위기를 선호하는 분에게 적합합니다.",
  나이트: "다양한 장르의 음악과 함께 즐거운 밤을 보낼 수 있는 나이트클럽입니다. 각 업장의 독특한 분위기와 매력을 경험해 보세요.",
};

export default async function ThemePage({ params }: Props) {
  const { theme } = await params;
  const decoded = decodeURIComponent(theme);
  const themeVenues = getVenuesByTheme(decoded);

  let hash = 0;
  for (let i = 0; i < decoded.length; i++) {
    hash = ((hash << 5) - hash + decoded.charCodeAt(i)) | 0;
  }
  const heroImg = HERO_IMAGES[Math.abs(hash) % HERO_IMAGES.length];

  return (
    <>
      <JsonLd data={itemListJsonLd(themeVenues)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: canonical("/") },
          {
            name: `${decoded} 나이트클럽`,
            url: canonical(`/theme/${encodeURIComponent(decoded)}/`),
          },
        ])}
      />

      {/* Hero */}
      <section className="relative h-[50vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={`${decoded} 나이트클럽 분위기`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pb-10 w-full">
          <Breadcrumb
            items={[
              { label: "홈", href: "/" },
              { label: `${decoded} 나이트클럽` },
            ]}
          />
          <h1 className="text-3xl md:text-5xl font-black mt-4 animate-fade-up">
            <span className="gradient-text">{decoded}</span>{" "}
            <span className="text-white">나이트클럽</span>
          </h1>
          <p className="text-gray-400 mt-3 animate-fade-up delay-100">
            {decoded} 테마 프리미엄 나이트클럽 {themeVenues.length}곳
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        {THEME_DESC[decoded] && (
          <p className="text-gray-500 mb-10 max-w-3xl leading-relaxed">
            {THEME_DESC[decoded]}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {themeVenues.map((v, i) => (
            <VenueCard key={v.slug} venue={v} index={i} />
          ))}
        </div>

        {themeVenues.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>아직 등록된 {decoded} 나이트클럽이 없습니다.</p>
          </div>
        )}
      </div>
    </>
  );
}
