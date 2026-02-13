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
  const title = `${decoded} 나이트클럽 — 테마별 전국 나이트클럽 모음`;
  const description = `${decoded} 테마의 전국 나이트클럽 목록입니다. ${decoded} 분위기를 즐길 수 있는 나이트클럽의 위치, 가격, 분위기 정보를 비교하세요.`;

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: {
      canonical: canonical(`/theme/${encodeURIComponent(decoded)}/`),
    },
  };
}

export default async function ThemePage({ params }: Props) {
  const { theme } = await params;
  const decoded = decodeURIComponent(theme);
  const themeVenues = getVenuesByTheme(decoded);

  const THEME_DESC: Record<string, string> = {
    "7080":
      "7080 나이트클럽은 70~80년대 음악과 소셜댄스를 중심으로 한 분위기의 나이트클럽입니다. 트로트, 팝, 발라드 등 다양한 장르의 음악과 함께 춤을 즐길 수 있으며, 중장년층뿐 아니라 다양한 연령대가 방문합니다.",
    소셜댄스:
      "소셜댄스 나이트클럽은 파트너와 함께 또는 자유롭게 댄스를 즐길 수 있는 공간입니다. 왈츠, 탱고, 지르박 등 다양한 댄스를 배우고 즐길 수 있습니다.",
    강남: "강남 지역의 프리미엄 나이트클럽입니다. 세련된 인테리어와 하이엔드 분위기가 특징이며, 20~30대 직장인 중심의 고급 클러빙 문화를 이끌고 있습니다.",
    클럽: "EDM, 힙합 등 최신 음악을 중심으로 한 클럽입니다. 대규모 사운드 시스템과 조명으로 몰입감 있는 파티를 즐길 수 있습니다.",
    라운지:
      "라운지 바 / 라운지 클럽은 대화가 가능한 수준의 음악과 함께 음료를 즐길 수 있는 공간입니다. 조용한 분위기를 선호하는 분에게 적합합니다.",
  };

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: `${decoded} 나이트클럽` },
          ]}
        />

        <h1 className="text-3xl font-extrabold mb-2">
          {decoded} 나이트클럽
        </h1>
        <p className="text-gray-500 mb-4">
          {decoded} 테마의 나이트클럽 {themeVenues.length}곳
        </p>

        {THEME_DESC[decoded] && (
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-3xl leading-relaxed">
            {THEME_DESC[decoded]}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themeVenues.map((v) => (
            <VenueCard key={v.slug} venue={v} />
          ))}
        </div>

        {themeVenues.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>아직 등록된 {decoded} 나이트클럽이 없습니다.</p>
          </div>
        )}
      </div>
    </>
  );
}
