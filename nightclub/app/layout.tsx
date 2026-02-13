import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 강남클럽 홍대라운지 서울나이트 핫플 추천`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "서울 강남 클럽, 홍대 라운지, 이태원 나이트 등 전국 프리미엄 나이트라이프 정보. 클럽 추천, 라운지 분위기, VIP 예약 안내. 최고의 밤을 만들어 드립니다.",
  keywords: [
    "강남 클럽",
    "강남 클럽 추천",
    "홍대 라운지",
    "서울 나이트",
    "서울 나이트 핫플",
    "이태원 클럽",
    "강남 나이트",
    "부산 클럽",
    "대구 나이트",
    "인천 나이트",
    "클럽 추천",
    "라운지 추천",
    "나이트클럽",
    "VIP 라운지",
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
