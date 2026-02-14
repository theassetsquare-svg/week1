import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `전국나이트클럽 추천 | 지역별 인기 클럽 & 라운지 모음 — ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "전국나이트클럽 정보를 한눈에 확인하세요. 지역별 인기 나이트, 클럽, 라운지 분위기와 추천 포인트 정리. 강남 클럽, 홍대 라운지, 부산 나이트 등 프리미엄 나이트라이프 가이드.",
  keywords: [
    "전국나이트클럽",
    "전국 나이트 추천",
    "전국 클럽 추천",
    "전국 라운지 추천",
    "서울 나이트 핫플",
    "강남 클럽 추천",
    "홍대 라운지 분위기",
    "나이트클럽 추천",
    "클럽 추천",
    "라운지 추천",
    "부산 나이트",
    "대구 나이트",
    "인천 나이트",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    images: [{ url: "/images/party-confetti.jpg", width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
