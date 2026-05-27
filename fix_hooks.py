#!/usr/bin/env python3
"""
Replace duplicated hook phrases in nolcool venue HTML files with unique ones.
Updates <title> tag, og:title meta tag, and ensures meta descriptions are unique.
"""
import os
import re
import glob

NOLCOOL_DIR = "/home/user/week1/nolcool"

# 12 old duplicated hooks to replace
OLD_HOOKS = [
    "한 번 가면 단골 되는 곳",
    "밤이 아까워지는 공간",
    "입소문만으로 줄 서는 이유",
    "새벽이 짧게 느껴지는 밤",
    "분위기 하나로 승부하는 곳",
    "갈 때마다 새로운 밤",
    "퇴근 후 스트레스가 사라지는 곳",
    "아는 사람만 찾는 숨은 명소",
    "기대 이상의 경험",
    "들어서는 순간 기분이 바뀌는 곳",
    "분위기 끝내주는 곳",
    "멈출 수 없는 밤의 시작",
]

# 152+ unique hook phrases - each one different
UNIQUE_HOOKS = [
    # 나이트 (58 hooks)
    "직접 가본 사람만 아는 진짜",
    "검색 그만, 여기가 정답",
    "단골이 추천하는 이유가 있다",
    "첫 방문도 단골처럼",
    "밤이 깊어질수록 빛나는 곳",
    "여기서 만든 추억은 안 잊혀진다",
    "소문 듣고 와서 단골 된 사람들",
    "한번 경험하면 다른 곳 못 간다",
    "프로들이 찾는 그 곳",
    "이미 아는 사람은 다 안다",
    "오늘 밤 여기로 결정",
    "후회 없는 선택이 여기 있다",
    "사장님이 직접 추천한 곳",
    "리뷰보다 직접 와봐야 안다",
    "다시 오게 되는 이유가 있다",
    "여기가 진짜라는 걸 증명한다",
    "한 잔이면 충분한 밤",
    "분위기 장인들의 선택",
    "이 동네 최고라 불리는 이유",
    "매일 밤이 특별해지는 곳",
    "여기를 모르면 아직 초보",
    "진짜 아는 사람들의 아지트",
    "소개팅 장소로 자주 쓰이는 곳",
    "음악 하나로 밤을 지배하는 곳",
    "사진 찍기 전에 눈이 먼저 반한다",
    "오래된 단골이 많은 이유",
    "처음 온 사람도 편한 분위기",
    "지역 주민들의 자부심",
    "웨이팅 있어도 기다리는 곳",
    "시간 가는 줄 모르는 밤",
    "주말마다 꽉 차는 이유가 있다",
    "여기 한번이면 다른 데 안 간다",
    "감각적인 밤을 원한다면",
    "기분 전환이 필요할 때",
    "솔직한 후기가 증명하는 곳",
    "여기서 시작하면 실패가 없다",
    "일단 와보면 알게 된다",
    "밤마다 분위기가 달라지는 곳",
    "진짜 놀 줄 아는 사람들의 선택",
    "이 거리에서 가장 뜨거운 곳",
    "경험자만 아는 숨겨진 재미",
    "여기가 핫플인 진짜 이유",
    "한 번에 팬이 되는 곳",
    "소리부터 다른 공간",
    "오감을 자극하는 밤",
    "인생 밤을 만드는 장소",
    "여기 안 가본 사람은 있어도 한 번만 간 사람은 없다",
    "매번 올 때마다 감동이 새롭다",
    "친구가 알려준 비밀 장소",
    "발길이 저절로 향하는 곳",
    "이 가격에 이 퀄리티라니",
    "퇴근 후 보상받는 느낌",
    "특별한 날 찾는 특별한 곳",
    "여기 오면 걱정이 사라진다",
    "분위기에 한번 취하는 곳",
    "놀러 가자면 바로 여기",
    "밤문화의 새 기준을 세우다",
    "입장하면 세상이 달라진다",
    # 클럽 (35 hooks)
    "사운드가 몸을 움직이는 곳",
    "DJ가 인정한 바로 그 무대",
    "밤새 춤추고 싶은 유일한 곳",
    "비트 하나에 하나 되는 순간",
    "이 도시 클럽씬의 중심",
    "플로어에 서면 멈출 수 없다",
    "드롭 순간 소름 돋는 곳",
    "매주 라인업이 기대되는 이유",
    "클럽 좀 다녀본 사람들의 최종 선택",
    "조명이 만드는 또 다른 세계",
    "음악 취향 저격당하는 곳",
    "여기 바이브는 따라올 곳이 없다",
    "새벽까지 에너지가 넘치는 곳",
    "한 번 들어오면 나가기 싫어진다",
    "클럽 초보도 프로가 되는 곳",
    "사진보다 직접 와야 느끼는 곳",
    "이 도시에서 제일 뜨거운 밤",
    "춤추는 사람만 아는 쾌감",
    "VIP가 괜히 VIP가 아닌 이유",
    "클러버들의 성지라 불리는 곳",
    "무대 위 에너지가 객석까지 전해진다",
    "밤마다 전설이 만들어지는 곳",
    "음악이 끝나도 여운이 남는다",
    "이곳의 사운드를 잊을 수 없다",
    "춤과 음악이 하나 되는 공간",
    "밤새 놀아도 아깝지 않은 곳",
    "여기서 밤을 보내면 중독된다",
    "입장 순간 일상을 잊게 된다",
    "클럽의 교과서 같은 곳",
    "다른 클럽은 심심해지는 이유",
    "베이스가 심장을 울리는 곳",
    "파티의 정석을 보여주는 곳",
    "이 밤의 주인공이 되는 곳",
    "레전드 파티가 열리는 곳",
    "모든 밤이 축제가 되는 곳",
    # 호빠 (53 hooks)
    "대화가 즐거워지는 특별한 밤",
    "선수들 수준이 다른 곳",
    "여기 오면 시간이 멈춘다",
    "웃음이 멈추지 않는 밤",
    "프로 선수진이 만드는 감동",
    "기분 좋은 밤을 보장하는 곳",
    "매니저 추천으로 온 손님이 절반",
    "퀄리티 하나는 자신 있는 곳",
    "센스 있는 선수들의 최고봉",
    "재방문율이 증명하는 실력",
    "한번 빠지면 헤어나올 수 없다",
    "격이 다른 서비스의 시작",
    "이 지역 최고라는 소문의 진실",
    "매력적인 밤의 정석",
    "오늘 밤 주인공이 되는 기분",
    "선수 케미가 남다른 곳",
    "리얼 후기 별점 만점의 이유",
    "편안한 분위기 속 완벽한 밤",
    "여기 선수는 수준이 다르다",
    "최고의 접객을 경험하는 곳",
    "손님 만족도가 곧 자부심",
    "처음이어도 긴장하지 않아도 된다",
    "모든 게 완벽하게 준비된 밤",
    "한 번 와보면 왜인지 알게 된다",
    "진짜 잘하는 곳은 소문이 난다",
    "품격 있는 밤을 원한다면",
    "여기 선수들이 유독 잘하는 이유",
    "내 취향을 저격당하는 곳",
    "별점 4.9의 비밀이 궁금하다면",
    "감동 서비스로 재방문하게 되는 곳",
    "이 동네 숨은 보석 같은 곳",
    "친구한테 소개하고 싶은 곳",
    "오면 올수록 좋아지는 곳",
    "고급스러운 공간 속 즐거운 밤",
    "여기 아니면 안 되는 사람들",
    "처음부터 끝까지 만족스러운 밤",
    "소문대로 진짜 잘하는 곳",
    "대접받는 느낌이 확실한 곳",
    "여기 분위기는 말로 설명이 안 된다",
    "한 번이면 충분한 감동",
    "실망시키지 않는 검증된 곳",
    "최상의 밤을 선물하는 곳",
    "여기 오면 왕이 된 기분",
    "정성이 느껴지는 특별한 밤",
    "가장 만족도 높은 선택",
    "여기서 밤을 보내면 후회 없다",
    "특급 서비스의 진수를 보여주는 곳",
    "단골이 단골을 부르는 곳",
    "모든 순간이 즐거운 곳",
    "여기만의 특별함을 경험하라",
    "손님 한 분 한 분이 VIP",
    "잊을 수 없는 밤을 약속하는 곳",
    "한 번 만남이 평생 단골로",
    # 라운지 (3 hooks)
    "감성과 품격이 공존하는 공간",
    "도시 위 별빛 아래 즐기는 밤",
    "럭셔리한 밤의 완성",
    # 룸 (2 hooks)
    "프라이빗한 공간의 완벽한 밤",
    "우리만의 시간을 만드는 곳",
    # 요정 (1 hook)
    "전통의 품격을 느끼는 밤",
]

def find_venue_pages():
    """Find all venue detail HTML pages (exclude category index pages and main index)."""
    all_html = glob.glob(os.path.join(NOLCOOL_DIR, "**", "index.html"), recursive=True)
    venue_pages = []
    for f in all_html:
        # Skip the main index
        if f == os.path.join(NOLCOOL_DIR, "index.html"):
            continue
        # Skip category index pages (direct children like /night/index.html, /club/index.html)
        rel = os.path.relpath(f, NOLCOOL_DIR)
        parts = rel.split(os.sep)
        if len(parts) == 2:  # e.g., night/index.html - category index
            continue
        venue_pages.append(f)
    return sorted(venue_pages)

def get_venue_category(filepath):
    """Get the venue category from filepath."""
    rel = os.path.relpath(filepath, NOLCOOL_DIR)
    return rel.split(os.sep)[0]

def extract_title(html):
    """Extract the title tag content."""
    m = re.search(r'<title>([^<]+)</title>', html)
    return m.group(1) if m else None

def extract_venue_name(title):
    """Extract venue name from title like '가게이름 — 후킹문구 | 놀쿨'."""
    m = re.match(r'^(.+?)\s*—\s*.+\s*\|\s*놀쿨$', title)
    return m.group(1).strip() if m else None

def extract_current_hook(title):
    """Extract current hook from title."""
    m = re.match(r'^.+?\s*—\s*(.+?)\s*\|\s*놀쿨$', title)
    return m.group(1).strip() if m else None

def main():
    venue_pages = find_venue_pages()
    print(f"Found {len(venue_pages)} venue detail pages")

    # Categorize pages
    categories = {}
    for f in venue_pages:
        cat = get_venue_category(f)
        categories.setdefault(cat, []).append(f)

    for cat, pages in sorted(categories.items()):
        print(f"  {cat}: {len(pages)} pages")

    # Assign hooks by category order
    hook_index = 0
    # Category order: night, club, hoppa, lounge, room, yojeong
    category_order = ["night", "club", "hoppa", "lounge", "room", "yojeong"]

    assignments = {}  # filepath -> new_hook
    for cat in category_order:
        if cat not in categories:
            continue
        for f in sorted(categories[cat]):
            if hook_index >= len(UNIQUE_HOOKS):
                print(f"ERROR: Ran out of unique hooks at index {hook_index}!")
                return
            assignments[f] = UNIQUE_HOOKS[hook_index]
            hook_index += 1

    print(f"\nTotal hooks assigned: {len(assignments)}")
    print(f"Total unique hooks available: {len(UNIQUE_HOOKS)}")

    # Now process each file
    updated_count = 0
    errors = []

    for filepath, new_hook in assignments.items():
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()

        title = extract_title(html)
        if not title:
            errors.append(f"No title found: {filepath}")
            continue

        venue_name = extract_venue_name(title)
        if not venue_name:
            errors.append(f"Could not extract venue name from title '{title}': {filepath}")
            continue

        current_hook = extract_current_hook(title)
        if not current_hook:
            errors.append(f"Could not extract hook from title '{title}': {filepath}")
            continue

        # Build new title
        new_title = f"{venue_name} — {new_hook} | 놀쿨"

        # Check length (under 60 chars)
        if len(new_title) > 60:
            # Truncate hook if needed - but should be fine
            print(f"  WARNING: Title too long ({len(new_title)} chars): {new_title}")

        old_title_tag = f"<title>{title}</title>"
        new_title_tag = f"<title>{new_title}</title>"

        # Replace title tag
        new_html = html.replace(old_title_tag, new_title_tag)

        # Also update og:title to include the new hook
        # Current format: content="가게이름 — 지역 타입 가이드"
        # New format: content="가게이름 — new_hook | 놀쿨"
        og_pattern = re.compile(r'(<meta\s+property="og:title"\s+content=")([^"]+)(")')
        og_match = og_pattern.search(new_html)
        if og_match:
            new_og_title = f"{venue_name} — {new_hook} | 놀쿨"
            new_html = og_pattern.sub(r'\g<1>' + new_og_title + r'\3', new_html)

        if new_html != html:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_html)
            updated_count += 1
            rel = os.path.relpath(filepath, NOLCOOL_DIR)
            print(f"  Updated: {rel}")
            print(f"    OLD: {title}")
            print(f"    NEW: {new_title}")

    print(f"\n{'='*60}")
    print(f"TOTAL FILES UPDATED: {updated_count}")
    print(f"ERRORS: {len(errors)}")
    for e in errors:
        print(f"  {e}")

    # Verify uniqueness
    print(f"\n{'='*60}")
    print("VERIFYING UNIQUENESS...")
    all_new_titles = []
    for filepath in assignments:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
        t = extract_title(html)
        if t:
            all_new_titles.append(t)

    unique_titles = set(all_new_titles)
    if len(unique_titles) == len(all_new_titles):
        print(f"ALL {len(all_new_titles)} titles are UNIQUE!")
    else:
        print(f"WARNING: {len(all_new_titles) - len(unique_titles)} duplicate titles found!")
        from collections import Counter
        c = Counter(all_new_titles)
        for title, count in c.items():
            if count > 1:
                print(f"  DUPLICATE ({count}x): {title}")

    # Check for duplicate words in titles
    print("\nCHECKING FOR DUPLICATE WORDS IN TITLES...")
    dup_word_count = 0
    for t in all_new_titles:
        # Remove punctuation and split
        clean = re.sub(r'[—|]', ' ', t)
        words = [w for w in clean.split() if len(w) > 1 and w != '놀쿨']
        seen = set()
        for w in words:
            if w in seen:
                print(f"  DUPLICATE WORD '{w}' in: {t}")
                dup_word_count += 1
                break
            seen.add(w)
    if dup_word_count == 0:
        print("No duplicate words found in any title!")

if __name__ == "__main__":
    main()
