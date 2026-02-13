import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-black">
            N
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">
            NIGHTLIFE KOREA
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/kr/seoul/seoul/nightclubs/"
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            서울
          </Link>
          <Link
            href="/kr/gyeonggi/suwon/nightclubs/"
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            경기
          </Link>
          <Link
            href="/kr/busan/busan/nightclubs/"
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            부산
          </Link>
          <Link
            href="/kr/incheon/incheon/nightclubs/"
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            인천
          </Link>
          <Link
            href="/theme/클럽/"
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            클럽
          </Link>
          <Link
            href="/theme/라운지/"
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            라운지
          </Link>
        </nav>
        <a
          href="https://open.kakao.com/o/sbesta12"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300"
        >
          제휴문의
        </a>
      </div>
    </header>
  );
}
