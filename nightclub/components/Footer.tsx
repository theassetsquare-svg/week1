import Link from "next/link";

function e(slug: string) {
  return "/club/" + encodeURIComponent(slug) + "/";
}

export default function Footer() {
  return (
    <footer className="relative mt-0">
      {/* CTA Section - 제휴문의 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/party-lights.jpg"
            alt="전국나이트클럽 프리미엄 나이트라이프"
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
            전국나이트클럽 프리미엄 파트너십을 원하시면<br className="hidden md:block" />
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
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">서울</h3>
              <ul className="space-y-2.5">
                <li><Link href={e("강남레이스클럽")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">강남레이스클럽</Link></li>
                <li><Link href={e("강남사운드클럽")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">강남사운드클럽</Link></li>
                <li><Link href={e("청담H2O나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">청담H2O나이트</Link></li>
                <li><Link href={e("이태원와이키키유토피아클럽")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">이태원와이키키유토피아클럽</Link></li>
                <li><Link href={e("하입라운지")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">하입라운지</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">수도권</h3>
              <ul className="space-y-2.5">
                <li><Link href={e("수원찬스돔나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">수원찬스돔나이트</Link></li>
                <li><Link href={e("일산샴푸나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">일산샴푸나이트</Link></li>
                <li><Link href={e("인천아라비안나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">인천아라비안나이트</Link></li>
                <li><Link href={e("성남샴푸나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">성남샴푸나이트</Link></li>
                <li><Link href={e("파주야당스카이돔나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">파주야당스카이돔나이트</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">지방</h3>
              <ul className="space-y-2.5">
                <li><Link href={e("부산아시아드나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">부산아시아드나이트</Link></li>
                <li><Link href={e("부산물나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">부산물나이트</Link></li>
                <li><Link href={e("대구바밤바나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">대구바밤바나이트</Link></li>
                <li><Link href={e("울산챔피언나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">울산챔피언나이트</Link></li>
                <li><Link href={e("천안스타돔나이트")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">천안스타돔나이트</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">라운지</h3>
              <ul className="space-y-2.5">
                <li><Link href={e("하입라운지")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">하입라운지</Link></li>
                <li><Link href={e("컬러라운지")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">컬러라운지</Link></li>
                <li><Link href={e("인트로라운지")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">인트로라운지</Link></li>
                <li><Link href={e("아르쥬라운지")} className="text-gray-500 hover:text-purple-400 text-sm transition-colors">아르쥬라운지</Link></li>
              </ul>
            </div>
          </div>
          <div className="divider-glow mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>&copy; 2026 전국나이트클럽 추천. All rights reserved.</p>
            <p>제휴문의 카카오톡: besta12</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
