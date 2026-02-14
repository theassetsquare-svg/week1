import { Venue } from "./types";
import { SITE_URL, canonical } from "./site";

export function localBusinessJsonLd(venue: Venue) {
  const url = canonical("/club/" + encodeURIComponent(venue.slug) + "/");
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name: venue.nameKo,
    alternateName: venue.nameKo,
    description: venue.summary,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address,
      addressLocality: venue.city,
      addressRegion: venue.region,
      addressCountry: "KR",
    },
    ...(venue.lat && venue.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: venue.lat,
            longitude: venue.lng,
          },
        }
      : {}),
    ...(venue.phone ? { telephone: venue.phone } : {}),
    url,
    image: `${SITE_URL}/images/party-confetti.jpg`,
    sameAs: [venue.instagram, venue.website].filter(Boolean),
  };
}

export function faqJsonLd(questions: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "전국나이트클럽 추천",
    url: SITE_URL,
    description:
      "전국나이트클럽 정보를 한눈에 확인하세요. 지역별 인기 나이트, 클럽, 라운지 분위기와 추천 포인트 정리.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function itemListJsonLd(venues: Venue[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: venues.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.nameKo,
      url: canonical(`/club/${encodeURIComponent(v.slug)}/`),
    })),
  };
}
