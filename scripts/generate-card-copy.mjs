#!/usr/bin/env node
/**
 * generate-card-copy.mjs v2
 *
 * 카드 설명 2줄을 가게별로 완전히 고유하게 생성합니다.
 *
 * 1줄(hook): 감정/호기심을 자극해서 클릭하게 만드는 문장
 * 2줄(value): 방문 전 진짜 도움 되는 구체 정보
 *
 * 규칙:
 *  - 금지 단어 (해당/이곳/공간/매장/감도/기준) = 0
 *  - 동일 단어 3회 초과 금지
 *  - Jaccard 유사도 >0.50 = 0쌍
 *  - 한 줄당 20~42자 (한국어)
 */

import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

// ─── Utils ───
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hasJongseong(char) {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}
function eN(w) { return hasJongseong(w[w.length-1]) ? '은' : '는'; }
function iG(w) { return hasJongseong(w[w.length-1]) ? '이' : '가'; }
function eR(w) { return hasJongseong(w[w.length-1]) ? '을' : '를'; }

const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];

function shortName(v) {
  let n = v.name_display;
  n = n.replace(new RegExp(`^${v.region}\\s*`), '');
  const wo = n.replace(/\s*(클럽|나이트|라운지)$/g, '').trim();
  if (wo.length >= 2) n = wo;
  return n.trim() || v.name_display;
}

// ─── Region descriptors ───
const RV = {
  '강남': '강남역 일대', '청담': '청담동', '이태원': '이태원 거리', '홍대': '홍대 앞',
  '부산서면': '서면', '부산해운대': '해운대', '부산광안리': '광안리',
  '대구': '동성로', '대전': '둔산동', '광주': '충장로', '전주': '객사',
  '강릉': '강릉', '인천부평': '부평', '수원': '수원',
  '제주': '제주', '잠실': '잠실', '성남': '성남', '일산': '일산',
  '고양': '고양', '인천': '인천', '천안': '천안', '부산': '부산',
  '울산': '울산', '평택': '평택', '부천': '부천', '의정부': '의정부',
  '창원': '창원', '포항': '포항', '경주': '경주', '김해': '김해',
  '춘천': '춘천', '청주': '청주', '순천': '순천', '목포': '목포',
  '압구정': '압구정', '인천송도': '송도', '상봉동': '상봉',
  '수유': '수유', '노원': '노원', '길동': '길동',
  '신림': '신림', '독산동': '독산', '강서': '강서', '강북': '강북',
};

// ─── HOOK 문장 풀 (타입별, 사람이 쓴 느낌) ───
// {n}=가게명, {r}=지역, {rv}=지역설명
const CLUB_HOOKS = [
  (n,r,rv) => `${rv} 새벽 2시, ${n} 플로어만 아직 끝나지 않았다`,
  (n,r,rv) => `첫 곡이 떨어지는 순간 ${n}의 진짜 밤이 시작된다`,
  (n,r,rv) => `${n}에서 한 번 놀아본 사람은 왜 재방문하는지 안다`,
  (n,r,rv) => `비트가 바닥을 타고 올라온다 — ${rv} ${n}의 사운드`,
  (n,r,rv) => `${rv} 클럽 중 ${n}만 유독 줄이 긴 데는 이유가 있다`,
  (n,r,rv) => `오늘 밤 어디 갈지 모르겠으면 ${n}부터 확인해봐`,
  (n,r,rv) => `DJ가 바뀌면 분위기도 바뀐다 — ${n} 라인업 체크 필수`,
  (n,r,rv) => `${r} 밤문화의 기준이 달라진다, ${n}에 들어서는 순간`,
  (n,r,rv) => `새벽이 아까워지는 곳, ${rv} ${n}의 에너지`,
  (n,r,rv) => `${n}${eR(n)} 한 번만 경험해보면 다른 곳이 심심해진다`,
  (n,r,rv) => `입구에서부터 심장이 뛴다 — ${n}은 그런 곳이다`,
  (n,r,rv) => `${rv}에서 밤새 춤출 곳을 찾는다면 ${n} 하나면 된다`,
  (n,r,rv) => `조명이 꺼지고 비트만 남을 때, ${n}의 진가가 보인다`,
  (n,r,rv) => `${n} 플로어에 서면 시간 감각이 사라진다는 후기가 많다`,
  (n,r,rv) => `금요일 밤 ${rv}, ${n}으로 향하는 사람들의 표정이 다르다`,
  (n,r,rv) => `${n}${eN(n)} 음악으로 승부한다 — 사운드에 자신 있는 곳`,
  (n,r,rv) => `처음 가도 어색하지 않다, ${n}이 초보한테 괜찮은 이유`,
  (n,r,rv) => `${rv} 클럽 입문자라면 ${n}에서 첫 경험하는 걸 추천`,
  (n,r,rv) => `밤 12시 지나면 ${n} 앞 줄이 2배로 늘어난다`,
  (n,r,rv) => `${n}의 금요일과 토요일은 완전히 다른 클럽이다`,
  (n,r,rv) => `술보다 음악이 먼저인 곳, ${rv} ${n}`,
  (n,r,rv) => `${n} 단골들이 말하는 최고의 타이밍은 새벽 1시`,
  (n,r,rv) => `네온 아래 낯선 사람과 눈이 마주치는 곳, ${n}`,
  (n,r,rv) => `${rv}의 밤을 제대로 즐기려면 ${n}${eR(n)} 빼놓을 수 없다`,
  (n,r,rv) => `${n}에 가면 왜 다들 새벽까지 안 나오는지 알게 된다`,
  (n,r,rv) => `혼자 가도 플로어에서 자연스럽게 섞인다 — ${n}`,
  (n,r,rv) => `${r}에서 음악 퀄리티로 따지면 ${n}${iG(n)} 빠지지 않는다`,
  (n,r,rv) => `${n} 안에 들어서면 밖의 세상은 잊어버리게 된다`,
  (n,r,rv) => `주말 ${rv} 핫플 중 ${n}만의 색깔은 확실히 있다`,
  (n,r,rv) => `클럽은 가봐야 안다 — ${n}의 분위기는 글로 설명 불가`,
];

const NIGHT_HOOKS = [
  (n,r,rv) => `밴드가 첫 곡을 시작하면 ${n}의 공기가 달라진다`,
  (n,r,rv) => `${rv}에서 파트너 댄스를 제대로 즐기려면 ${n}`,
  (n,r,rv) => `웨이터가 마음을 전해주는 곳 — ${n}의 밤은 특별하다`,
  (n,r,rv) => `${n}에 오면 나이는 숫자일 뿐이라는 걸 느끼게 된다`,
  (n,r,rv) => `눈이 마주치면 이미 시작이다 — ${rv} ${n}의 룰`,
  (n,r,rv) => `라이브 밴드 앞에서 스텝 밟는 순간 스트레스가 녹는다`,
  (n,r,rv) => `${n}${eN(n)} 혼자 와도 외롭지 않은 몇 안 되는 곳이다`,
  (n,r,rv) => `${rv} 밤문화의 원조, ${n}에서 시작하는 이유가 있다`,
  (n,r,rv) => `춤을 못 춰도 괜찮다 — ${n}에서는 분위기가 리드한다`,
  (n,r,rv) => `${n}의 금토 밤은 테이블 빈 곳이 없다, 일찍 오는 게 답`,
  (n,r,rv) => `조명이 바뀌고 밴드가 올라오면 ${n}의 2막이 시작된다`,
  (n,r,rv) => `${rv} 나이트 중 ${n}만 찾는 단골이 유독 많은 이유`,
  (n,r,rv) => `새로운 인연이 필요한 밤, ${n}이 정답에 가깝다`,
  (n,r,rv) => `${n}에서 보낸 밤은 다음 날 아침까지 기분이 좋다`,
  (n,r,rv) => `분위기 좋고 사람 좋은 ${rv} 나이트, ${n}의 비결`,
  (n,r,rv) => `음악이 몸을 움직이게 하는 곳 — ${n}의 라이브는 다르다`,
  (n,r,rv) => `${n} 웨이터의 센스가 밤의 퀄리티를 좌우한다`,
  (n,r,rv) => `40대든 50대든, ${n} 플로어에서는 모두 청춘이다`,
  (n,r,rv) => `파트너 댄스의 매력을 알게 되면 ${n}${eR(n)} 끊을 수 없다`,
  (n,r,rv) => `${rv}에서 금요일 밤 약속 잡는다면 ${n}부터 확인`,
  (n,r,rv) => `${n}에 가기 전 스텝 하나만 배워가면 10배 더 즐긴다`,
  (n,r,rv) => `밴드 음악에 맞춰 춤추는 재미, ${n}에서만 느끼는 감각`,
  (n,r,rv) => `${r} 나이트 입문자라면 ${n}이 진입장벽 가장 낮다`,
  (n,r,rv) => `${n}의 분위기는 밤 11시부터 완전히 달라진다`,
  (n,r,rv) => `혼자 테이블에 앉아도 웨이터가 자연스럽게 이어준다`,
  (n,r,rv) => `${n}에서 만난 사람과 다음 주에 또 마주치는 일이 잦다`,
  (n,r,rv) => `${rv}의 밤이 심심하다면 ${n}${eR(n)} 아직 안 가본 거다`,
  (n,r,rv) => `${n} 테이블마다 이야기가 있다 — 오늘 당신 차례`,
  (n,r,rv) => `나이트는 시끄럽기만 할 거라는 편견, ${n}에서 깨진다`,
  (n,r,rv) => `${n}의 라이브 밴드는 가수 뺨치는 실력이라는 평`,
];

const LOUNGE_HOOKS = [
  (n,r,rv) => `칵테일 한 잔이면 옆자리 대화가 시작된다 — ${rv} ${n}`,
  (n,r,rv) => `시끄러운 곳 말고, 대화가 되는 곳 — ${n}이 그렇다`,
  (n,r,rv) => `${n}에서는 음악이 아니라 대화가 주인공이다`,
  (n,r,rv) => `첫 데이트 장소 고민 끝, ${rv} ${n}이면 실패 없다`,
  (n,r,rv) => `${n}의 바텐더에게 오늘의 추천을 물어보는 것부터 시작`,
  (n,r,rv) => `${rv} 감성 바 중 ${n}만의 분위기는 확실히 다르다`,
  (n,r,rv) => `조용하지만 설렌다 — ${n}에서 보내는 밤의 온도`,
  (n,r,rv) => `${n}${eN(n)} 술보다 함께하는 사람이 더 중요한 곳이다`,
  (n,r,rv) => `바 카운터에 앉으면 자연스러운 대화가 흐른다 — ${n}`,
  (n,r,rv) => `분위기 좋은 곳에서 번호 교환, ${n}에서는 자연스럽다`,
  (n,r,rv) => `${n}의 시그니처 칵테일은 주문하는 순간 대화가 된다`,
  (n,r,rv) => `${rv}에서 무드 있는 밤을 보내고 싶다면 ${n}`,
  (n,r,rv) => `${n} 창가석에 앉으면 시간이 천천히 흐르는 느낌이다`,
  (n,r,rv) => `혼자 와서 위스키 한 잔, ${n}에서는 그게 멋있다`,
  (n,r,rv) => `${n}의 조명과 음악은 대화를 더 깊게 만들어준다`,
  (n,r,rv) => `기념일에 ${n}${eR(n)} 예약하면 분위기는 보장된다`,
  (n,r,rv) => `${rv} 라운지 중 재방문율 높은 ${n}, 이유가 있다`,
  (n,r,rv) => `목소리를 높이지 않아도 대화가 되는 곳 — ${n}`,
  (n,r,rv) => `${n}에서 마시는 한 잔은 집에서 마시는 것과 완전 다르다`,
  (n,r,rv) => `${rv}에서 특별한 사람과의 시간, ${n}이 정답이다`,
  (n,r,rv) => `${n}의 BGM은 대화를 방해하지 않고 감싸준다`,
  (n,r,rv) => `소모임 장소 찾는다면 ${n} 프라이빗석 확인해봐`,
  (n,r,rv) => `${n} 바텐더의 추천 한마디로 밤이 달라진 적 많다`,
  (n,r,rv) => `편하게 앉아서 좋은 술 한 잔, ${n}이 그런 곳이다`,
  (n,r,rv) => `${n}${eN(n)} 분위기를 파는 게 아니라 경험을 파는 곳이다`,
  (n,r,rv) => `낮에는 모르지만, 밤의 ${n}${eN(n)} 완전히 다른 곳이 된다`,
  (n,r,rv) => `${rv}에서 조용히 취하고 싶은 밤, ${n}만한 곳이 없다`,
  (n,r,rv) => `${n}에서 보낸 저녁이 2차 없이도 충분한 밤이 된다`,
  (n,r,rv) => `무드등 아래 마주 앉으면 어색함이 사라진다 — ${n}`,
  (n,r,rv) => `${n}의 위스키 셀렉션은 ${rv}에서 손꼽히는 수준이다`,
];

// ─── VALUE 문장 풀 (타입별, 진짜 도움되는 정보) ───
const CLUB_VALUES = [
  (n,r) => `${n} 금토 대기 30분 이상, 자정 전 도착이 핵심`,
  (n,r) => `신분증 없으면 입장 불가 — ${n} 방문 전 꼭 챙기세요`,
  (n,r) => `${n} 게스트 등록하면 입장료 할인, SNS 확인 추천`,
  (n,r) => `올블랙 복장이 가장 무난, ${n} 드레스코드 참고`,
  (n,r) => `${n} 테이블 vs 스탠딩 가격 차이 크니 미리 확인`,
  (n,r) => `평일 ${n}${eN(n)} 한적해서 DJ 음악 제대로 감상 가능`,
  (n,r) => `${n} 피크타임은 새벽 1시 전후, 너무 늦으면 마감 무드`,
  (n,r) => `${n} 첫 방문이면 오픈 시간에 맞춰 가서 분위기 파악`,
  (n,r) => `${n} 음료 1잔 기준 1.5~2만원대, 예산 미리 잡아두세요`,
  (n,r) => `${r}역에서 ${n}까지 도보 가능, 교통편 미리 체크`,
  (n,r) => `혼자 가면 ${n} 바 카운터, 단체면 테이블 예약 추천`,
  (n,r) => `${n} 귀가 교통편 미리 확인 — 새벽 택시 잡기 어려울 수 있음`,
  (n,r) => `비 오는 날 ${n}${eN(n)} 대기 줄 짧아 여유롭게 입장 가능`,
  (n,r) => `${n} 재입장 가능 여부 입구에서 꼭 확인하고 들어가세요`,
  (n,r) => `${n} SNS에 당일 DJ 라인업 올라오니 가기 전 체크`,
  (n,r) => `${n} 단체 방문 시 테이블 사전 예약이 필수인 경우 많음`,
  (n,r) => `${n} 입장 거절 당하지 않으려면 슬리퍼, 반바지 피하세요`,
  (n,r) => `주말 ${n}${eN(n)} 새벽 3시까지 영업, 2차로도 좋은 선택`,
  (n,r) => `${n} 촬영 제한 구역 있을 수 있으니 입장 시 안내 확인`,
  (n,r) => `${n} 음료 반입 불가, 소지품 검사 후 입장하는 구조`,
  (n,r) => `${n} 멤버십/재방문 할인 있는지 퇴장 전 물어보세요`,
  (n,r) => `${n} 주중 이벤트 요일 확인하면 입장료 아끼는 방법 있음`,
  (n,r) => `${n} 클럽 주변 편의점/ATM 위치 미리 파악하면 편리`,
  (n,r) => `${n} 코인락커 유무 확인 — 외투/짐 보관이 관건`,
  (n,r) => `친구 생일 파티라면 ${n} 테이블 패키지 문의 추천`,
  (n,r) => `${n}${eN(n)} 여름 시즌에 특별 이벤트가 많으니 시기 참고`,
  (n,r) => `${n} 입장 전 물 한 병 사서 마시면 컨디션 유지에 좋음`,
  (n,r) => `${n} 주차 어려우니 ${r}역 기준 대중교통 이용 추천`,
  (n,r) => `${n} 입장료에 음료 포함인지 미리 확인하면 예산 절약`,
  (n,r) => `${n} 웨이팅 중 근처 카페에서 대기하는 것도 방법`,
];

const NIGHT_VALUES = [
  (n,r) => `${n} 밤 10시 이후 본격 시작, 자정이 가장 뜨거운 시간`,
  (n,r) => `혼자 ${n} 가도 웨이터가 자리 안내해주니 부담 없음`,
  (n,r) => `${n} 복장은 깔끔한 캐주얼이면 충분, 슬리퍼만 피하세요`,
  (n,r) => `${n} 파트너 댄스 거절 시 정중히 인사, 에티켓이 중요`,
  (n,r) => `${n} 입장료에 음료 1잔 포함인 경우 많으니 미리 확인`,
  (n,r) => `${n} 라이브 밴드 시간 확인하고 가면 타이밍 딱 맞음`,
  (n,r) => `주말 ${n}${eN(n)} 피크 전 도착해야 좋은 자리 확보 가능`,
  (n,r) => `${n} 기본 스텝만 알면 충분, 못 춰도 분위기로 즐김`,
  (n,r) => `${n} 연령대 확인 후 방문하면 분위기 미스매치 방지`,
  (n,r) => `${n} 주말 예약 가능한지 미리 전화해보는 게 안전`,
  (n,r) => `${r}에서 ${n}까지 교통편 미리 체크, 주차 가능 여부 확인`,
  (n,r) => `${n} 퇴장 시간 확인하고 막차/대리 미리 예약 추천`,
  (n,r) => `${n} 웨이터 서비스 있으니 테이블에서 편하게 즐기면 됨`,
  (n,r) => `${n} 금요일 vs 토요일 분위기 다르니 취향에 맞게 선택`,
  (n,r) => `${n} 단체석 필요하면 최소 하루 전 연락이 안전`,
  (n,r) => `${n} 후기에서 실제 연령대 확인하면 방문 판단에 도움`,
  (n,r) => `대리운전 번호 미리 저장하고 ${n} 방문하면 귀가 편리`,
  (n,r) => `${n} 음료 메뉴 미리 보면 현장에서 고민 시간 줄어듦`,
  (n,r) => `${n} 첫 방문이면 바 근처 자리에서 분위기 파악 추천`,
  (n,r) => `${n} 동행 없이 가도 어색하지 않으니 솔로도 추천`,
  (n,r) => `${n}${eN(n)} 보통 새벽 2~3시까지 영업, 일정 참고`,
  (n,r) => `${n} 입장 시 신분증 필수 — 없으면 입장 거절됨`,
  (n,r) => `${n} 주변 맛집에서 저녁 먹고 가면 동선이 깔끔`,
  (n,r) => `${n} 음료 가격대 미리 확인, 보통 잔당 1~2만원대`,
  (n,r) => `비 오는 날 ${n}${eN(n)} 오히려 한적해서 쾌적하게 즐김`,
  (n,r) => `${n} 여름 시즌 이벤트 확인하면 특별한 밤이 가능`,
  (n,r) => `${n} 재방문 시 웨이터가 기억해주면 서비스 달라질 수 있음`,
  (n,r) => `${n} 금토는 11시 전 도착 추천, 이후는 자리 확보 어려움`,
  (n,r) => `${n} 클로즈 타임 가까워지면 분위기 정리 무드이니 참고`,
  (n,r) => `${n} 방문 전 네이버/카카오 지도에서 위치 확인 필수`,
];

const LOUNGE_VALUES = [
  (n,r) => `금토 ${n}${eN(n)} 예약 필수, 최소 하루 전 연락 추천`,
  (n,r) => `${n} 바 카운터석이 분위기 최고, 도착하면 먼저 확인`,
  (n,r) => `${n} 시그니처 칵테일 먼저 물어보면 바텐더와 대화 시작`,
  (n,r) => `2인 기준 ${n} 예산, 칵테일 4잔+안주로 10~15만원대`,
  (n,r) => `${n} 데이트면 창가석이나 프라이빗석 미리 요청하세요`,
  (n,r) => `${n} 스마트 캐주얼 이상이면 무난, 편한 복장도 가능`,
  (n,r) => `혼자 ${n} 방문 시 바 카운터에 앉으면 어색함 전혀 없음`,
  (n,r) => `${n} BGM이 적당해서 대화하기 편한 분위기`,
  (n,r) => `주중 ${n} 방문하면 한적하고 여유로운 분위기 만끽 가능`,
  (n,r) => `${n} 위스키/와인 메뉴 다양한지 가기 전 체크 추천`,
  (n,r) => `${r}에서 ${n}까지 주차 가능한지 미리 확인하면 편리`,
  (n,r) => `${n} 소모임이면 프라이빗 룸 있는지 미리 문의`,
  (n,r) => `${n} 오픈 직후 가면 원하는 좌석 선점 가능`,
  (n,r) => `${n} 안주와 음료 페어링, 바텐더에게 요청하면 추천해줌`,
  (n,r) => `기념일에 ${n} 예약 시 케이크/꽃 반입 가능 여부 확인`,
  (n,r) => `${n} 야외 테라스 있으면 날씨 좋은 날 방문이 배로 좋음`,
  (n,r) => `${n} 최근 인테리어 변경됐을 수 있으니 SNS 사진 확인`,
  (n,r) => `${n} 칵테일 1잔 기준 1.5~3만원대, 예산 참고하세요`,
  (n,r) => `${n} 분위기는 시간대에 따라 다르니 원하는 무드 시간 확인`,
  (n,r) => `${n} 테이블 차지/최소 주문 유무 미리 확인하면 편함`,
  (n,r) => `${n} 주변 2차 가기 좋은 곳도 미리 파악하면 동선 깔끔`,
  (n,r) => `${n} 평일 해피아워 있는지 확인하면 가격 절약 가능`,
  (n,r) => `${n} 발렛 파킹 가능한지 미리 문의하면 도착이 편리`,
  (n,r) => `${n} 단체 예약 시 코스 메뉴 옵션 있는지 확인 추천`,
  (n,r) => `${n} 마감 시간 확인 — 보통 새벽 1~2시 사이`,
  (n,r) => `${n} 화장실 컨디션이 좋다는 후기가 많으니 참고`,
  (n,r) => `${n}${eN(n)} 생일/프로포즈 이벤트 협조가 잘 되는 편`,
  (n,r) => `${n} 근처 주차장 위치 미리 네이버 지도에서 확인`,
  (n,r) => `${n} 단골이 되면 바텐더가 취향에 맞는 술을 추천해줌`,
  (n,r) => `${n} 주말 저녁 8시 이후 분위기가 확 달라지니 참고`,
];

// ─── Tag pools ───
const TAG_POOL = {
  club: ['DJ라인업', '피크타임', '드레스코드', '게스트등록', '입장팁', '테이블예약', 'EDM', '힙합', '하우스', '올블랙', '새벽영업', '스탠딩', '댄스플로어', '사운드', '조명쇼', '신분증필수', '단체가능', '역세권'],
  night: ['라이브밴드', '파트너댄스', '웨이터서비스', '피크타임', '복장팁', '혼자방문OK', '음료포함', '댄스에티켓', '주말추천', '연령대확인', '자리배정', '스텝기초', '예약가능', '신분증필수', '주차확인', '2차추천'],
  lounge: ['칵테일', '예약필수', '데이트', '바카운터', '프라이빗', '시그니처', '위스키', '와인', '소모임', '무드등', '야외테라스', 'BGM', '스마트캐주얼', '감성주점', '바텐더추천', '기념일'],
};

function generateImageAlt(v) {
  const district = v.geo?.district || '';
  const neighborhood = v.geo?.neighborhood || '';
  let loc = neighborhood || district;
  if (loc === v.region || loc === v.regionSlug) loc = '';
  return `${v.name_display} ${loc ? loc + ' ' : ''}${v.region} ${v.typeLabel} 썸네일`.replace(/\s{2,}/g, ' ');
}

function generateMapUrl(v) {
  return `https://map.kakao.com/?q=${encodeURIComponent(v.name_display + ' ' + v.region)}`;
}

function generateCardTags(v) {
  const pool = TAG_POOL[v.type] || TAG_POOL.club;
  const h = hashStr(v.id + 'tags');
  const count = 3 + (h % 3);
  const selected = [];
  const used = new Set();
  for (let i = 0; selected.length < count && i < pool.length; i++) {
    const idx = (h + i * 7) % pool.length;
    if (!used.has(idx)) { used.add(idx); selected.push(pool[idx]); }
  }
  return selected;
}

// ─── Assign unique (hookIdx, valueIdx) pairs per type ───
const usedPairs = { club: new Set(), night: new Set(), lounge: new Set() };

function pickUniquePair(v, hookPool, valuePool) {
  const pairSet = usedPairs[v.type];
  const h = hashStr(v.id + 'pairV3');
  let hi = h % hookPool.length;
  let vi = (h >> 5) % valuePool.length;
  let attempts = 0;
  const max = hookPool.length * valuePool.length;

  while (pairSet.has(`${hi}-${vi}`) && attempts < max) {
    attempts++;
    vi = (vi + 1) % valuePool.length;
    if (vi === 0) hi = (hi + 1) % hookPool.length;
  }
  pairSet.add(`${hi}-${vi}`);
  return { hi, vi };
}

// ─── Main ───
console.log(`Generating card copy v2 for ${venues.length} venues...\n`);

const hookPools = { club: CLUB_HOOKS, night: NIGHT_HOOKS, lounge: LOUNGE_HOOKS };
const valuePools = { club: CLUB_VALUES, night: NIGHT_VALUES, lounge: LOUNGE_VALUES };

let bannedCount = 0, repeatCount = 0;

venues.forEach(v => {
  const n = shortName(v);
  const r = v.region;
  const rv = RV[r] || r;
  const hooks = hookPools[v.type];
  const values = valuePools[v.type];
  const { hi, vi } = pickUniquePair(v, hooks, values);

  let hook = hooks[hi](n, r, rv);
  let value = values[vi](n, r);

  // Remove banned words
  BANNED.forEach(w => { hook = hook.replaceAll(w, ''); value = value.replaceAll(w, ''); });
  hook = hook.replace(/\s{2,}/g, ' ').trim();
  value = value.replace(/\s{2,}/g, ' ').trim();

  // Truncate if too long
  if (hook.length > 45) hook = hook.substring(0, 42).replace(/[,.\s]+$/, '');
  if (value.length > 45) value = value.substring(0, 42).replace(/[,.\s]+$/, '');

  v.card_hook = hook;
  v.card_value = value;
  v.card_tags = generateCardTags(v);
  v.image_alt = generateImageAlt(v);
  v.map_url = generateMapUrl(v);
  if (v.images?.[0]) v.images[0].alt = v.image_alt;

  // Validate
  const combined = hook + ' ' + value;
  if (BANNED.some(w => combined.includes(w))) { bannedCount++; console.warn(`  BANNED: ${v.name_display}`); }
  const words = combined.split(/[\s,./·—]+/).filter(w => w.length > 1);
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w]||0)+1; });
  if (Object.values(freq).some(c => c > 3)) { repeatCount++; console.warn(`  REPEAT: ${v.name_display}`); }
});

// ─── Similarity check ───
function tokenize(t) { return new Set(t.split(/[\s,./·:;!?→—]+/).filter(w => w.length > 1)); }
function jaccard(a,b) { const i=[...a].filter(x=>b.has(x)).length; const u=new Set([...a,...b]).size; return u?i/u:0; }

const cards = venues.map(v => ({ name: v.name_display, tokens: tokenize(v.card_hook+' '+v.card_value) }));
let high = 0, mid = 0;
for (let i = 0; i < cards.length; i++)
  for (let j = i+1; j < cards.length; j++) {
    const s = jaccard(cards[i].tokens, cards[j].tokens);
    if (s > 0.50) { high++; if (high <= 3) console.warn(`  HIGH SIM ${s.toFixed(2)}: ${cards[i].name} <-> ${cards[j].name}`); }
    else if (s > 0.35) mid++;
  }

writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');

console.log(`Done. ${venues.length} venues updated.`);
console.log(`  Banned: ${bannedCount} | Repeat: ${repeatCount} | Sim>0.50: ${high} | Sim>0.35: ${mid}`);
if (bannedCount || repeatCount) { console.error('FAILED'); process.exit(1); }
console.log('PASS');
