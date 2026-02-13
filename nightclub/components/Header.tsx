import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🌃</span>
          <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            전국 나이트클럽
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:text-violet-600 transition-colors">
            홈
          </Link>
          <Link
            href="/kr/seoul/seoul/nightclubs/"
            className="hover:text-violet-600 transition-colors"
          >
            서울
          </Link>
          <Link
            href="/kr/gyeonggi/suwon/nightclubs/"
            className="hover:text-violet-600 transition-colors"
          >
            경기
          </Link>
          <Link
            href="/theme/7080/"
            className="hover:text-violet-600 transition-colors"
          >
            7080
          </Link>
        </nav>
      </div>
    </header>
  );
}
