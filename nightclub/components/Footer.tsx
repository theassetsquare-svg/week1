import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-0">
      {/* CTA Section - 제휴문의 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/party-lights.jpg"
            alt="프리미엄 나이트라이프"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-purple-950/90 to-[#050508]" />
        </div>
        <div className="relative py-24 md:py-32 text-center px-4">
          <p className="text-purple-300 text-sm md:text-base font-medium tracking-[0.3em] uppercase mb-4 animate-fade-up">
            Partnership
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 animate-fade-up delay-100">
            <span className="gradient-text">제휴문의</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto animate-fade-up delay-200">
            프리미엄 나이트라이프 파트너십을 원하시면<br className="hidden md:block" />
            지금 바로 연락해 주세요
          </p>
          <a
            href="https://open.kakao.com/o/sbesta12"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-xl md:text-2xl font-black px-12 md:px-16 py-5 md:py-6 rounded-full neon-glow hover:scale-105 transition-all duration-300 animate-fade-up delay-300"
          >
            <svg className="w-7 h-7 md:w-8 md:h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.5 3 2 6.58 2 11c0 2.83 1.82 5.32 4.56 6.73-.2.73-.72 2.65-.83 3.06-.13.5.18.5.38.36.16-.1 2.46-1.67 3.44-2.35.48.07.96.1 1.45.1 5.5 0 10-3.58 10-8s-4.5-7.9-10-7.9z" />
            </svg>
            카카오톡 besta12
          </a>
          <p className="text-purple-400/60 text-sm mt-6 animate-fade-up delay-400">
            24시간 상담 가능
          </p>
        </div>
      </section>

      {/* Footer Links */}
      <div className="bg-[#030306] border-t border-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
                서울
              </h3>
              <ul className="space-y-2.5">
                <li><Link href="/club/gangnam-race/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">강남 레이스클럽</Link></li>
                <li><Link href="/club/gangnam-sound/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">강남 사운드클럽</Link></li>
                <li><Link href="/club/cheongdam-h2o/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">청담 H2O나이트</Link></li>
                <li><Link href="/club/itaewon-waikiki/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">이태원 와이키키</Link></li>
                <li><Link href="/club/hype-lounge/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">압구정 하입라운지</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
                수도권
              </h3>
              <ul className="space-y-2.5">
                <li><Link href="/club/suwon-chance-dome/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">수원 찬스돔나이트</Link></li>
                <li><Link href="/club/ilsan-shampoo/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">일산 샴푸나이트</Link></li>
                <li><Link href="/club/incheon-arabian/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">인천 아라비안나이트</Link></li>
                <li><Link href="/club/seongnam-shampoo/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">성남 샴푸나이트</Link></li>
                <li><Link href="/club/paju-skydome/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">파주 스카이돔나이트</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
                지방
              </h3>
              <ul className="space-y-2.5">
                <li><Link href="/club/busan-asiad/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">부산 아시아드나이트</Link></li>
                <li><Link href="/club/busan-mul/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">부산 물나이트</Link></li>
                <li><Link href="/club/daegu-babamba/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">대구 바밤바나이트</Link></li>
                <li><Link href="/club/ulsan-champion/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">울산 챔피언나이트</Link></li>
                <li><Link href="/club/cheonan-stardom/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">천안 스타돔나이트</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
                라운지
              </h3>
              <ul className="space-y-2.5">
                <li><Link href="/club/hype-lounge/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">하입라운지</Link></li>
                <li><Link href="/club/color-lounge/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">컬러라운지</Link></li>
                <li><Link href="/club/intro-lounge/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">인트로라운지</Link></li>
                <li><Link href="/club/arju-lounge/" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">아르쥬라운지</Link></li>
              </ul>
            </div>
          </div>
          <div className="divider-glow mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>&copy; 2026 NIGHTLIFE KOREA. All rights reserved.</p>
            <p>제휴문의 카카오톡: besta12</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
