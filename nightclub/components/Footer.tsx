import Link from "next/link";
import { allThemes } from "@/lib/venues";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-12 bg-gray-50 dark:bg-[#111]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              지역별
            </h3>
            <ul className="space-y-2 text-gray-500">
              <li>
                <Link href="/kr/seoul/seoul/nightclubs/" className="hover:text-violet-600">
                  서울 나이트클럽
                </Link>
              </li>
              <li>
                <Link href="/kr/gyeonggi/suwon/nightclubs/" className="hover:text-violet-600">
                  수원 나이트클럽
                </Link>
              </li>
              <li>
                <Link href="/kr/gyeonggi/goyang/nightclubs/" className="hover:text-violet-600">
                  일산/고양 나이트클럽
                </Link>
              </li>
              <li>
                <Link href="/kr/incheon/incheon/nightclubs/" className="hover:text-violet-600">
                  인천 나이트클럽
                </Link>
              </li>
              <li>
                <Link href="/kr/gyeongnam/ulsan/nightclubs/" className="hover:text-violet-600">
                  울산 나이트클럽
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              테마별
            </h3>
            <ul className="space-y-2 text-gray-500">
              {allThemes.map((t) => (
                <li key={t}>
                  <Link
                    href={"/theme/" + encodeURIComponent(t) + "/"}
                    className="hover:text-violet-600"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              가이드
            </h3>
            <ul className="space-y-2 text-gray-500">
              <li>
                <Link href="/guide/seoul/first-time/" className="hover:text-violet-600">
                  서울 나이트 초보 가이드
                </Link>
              </li>
              <li>
                <Link href="/guide/suwon/first-time/" className="hover:text-violet-600">
                  수원 나이트 초보 가이드
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              전국 나이트클럽 정보
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              전국 나이트클럽의 위치, 분위기, 가격, 드레스코드 정보를 한곳에 모았습니다.
              방문 전 필요한 모든 정보를 확인하세요.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
          © 2025 전국 나이트클럽 정보. 본 사이트는 정보 제공 목적이며, 각 업소의 실제 운영 상황은 직접 확인하시기 바랍니다.
        </div>
      </div>
    </footer>
  );
}
