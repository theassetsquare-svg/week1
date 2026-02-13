export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://week1-6m5.pages.dev";

export const SITE_NAME = "전국 나이트클럽 정보";
export const SITE_DESCRIPTION =
  "전국 나이트클럽 위치, 분위기, 가격, 드레스코드, 초보 가이드까지 — 방문 전 필요한 모든 정보를 한곳에서 확인하세요.";

export function canonical(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
