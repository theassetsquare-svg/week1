#!/usr/bin/env node
// 가게 전용 사이트(dd) — 빌드 맨 끝 단계. 광고주59-1(2026-10-25 · 대표님 03:35·05:35): 장안동호빠 큐브(담당 유현재 실장) 광고주 세트를 세 쪽에 넣는다.
//   /venue/jangandong-hoppa-flex/ · /venue/jangandong-hoppa-cube/ · /venue/sinlim-hoppa-race/ (주소 그대로 · 301 0)
//   틀(src/pages/venue/[slug].astro · src/layouts/BaseLayout.astro)은 다른 쪽과 같이 쓰므로 고치지 않고, 빌드 결과의 그 세 쪽 파일만 고친다.
//   세 쪽의 <main> 안은 지어낸 묘사(그래피티·정육면체 부스·체커 플래그 · 가짜 후기 · 퀴즈 · 혜택)뿐이라 통째로 새 글로 바꾼다 — 받은 사실(이름 · 호빠 ·
//   서울 동대문구 장안동 · 담당 · 번호)만 쓰고 모르는 것(영업시간 · 요금 · 주차 · 실내)은 「받지 못함」으로 적는다. 선례 = scripts/ad-set-sillim.mjs.
//   의존성 0(node 내장만). 찾을 자리를 하나라도 못 찾으면 무엇을 못 찾았는지 찍고 종료코드 1 — 세 쪽 다 맞을 때만 한꺼번에 쓴다(반쪽 0).
//   이미 넣은 파일에 다시 돌리면 확인만 하고 그대로 둔다(멱등). 주소 · canonical · og:url 은 바꾸지 않는다(앞뒤를 견줘 다르면 종료 1).
// 쓰는 법: node scripts/ad-set-cube.mjs [뿌리 폴더]   (뿌리 = 기본 dist · 환경변수 AD_SET_ROOT 로도 바꿀 수 있음)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || process.env.AD_SET_ROOT || 'dist';
const HOST = 'https://dd.nolcool.com';
const NAME = '장안동호빠 큐브';
const NICK = '유현재 실장';
const PHONE = '010-7674-8310';
const TAG = '[ad-set-cube]';
function stop(msg) { console.error(`${TAG} 실패 — ${msg}`); process.exit(1); }
if (!/^010-\d{4}-\d{4}$/.test(PHONE)) stop(`번호가 010-XXXX-XXXX 꼴이 아님(「${PHONE}」)`);
const DIGITS = PHONE.replace(/\D/g, '');
const TEL = `tel:${DIGITS}`;
const LD_TEL = `+82-${PHONE.slice(1)}`;
const ALT = `${NAME} ${NICK} ${PHONE} 광고문의 카톡 besta12`;
const BAR_TEXT = `${NAME} 예약 · ${NICK} ${PHONE}`;
const NOTICE = `이 페이지는 광고이며, 업소 제공 정보를 받아 실었습니다(담당 ${NICK}). 확인일 2026-10-25. 실린 내용은 사정에 따라 바뀔 수 있습니다.`;
// 선례와 같은 까닭(ad-set-sillim.mjs 머리 주석): PC 에서 바 상한을 풀고, 숨은 아래 안내 창 둘이 폰 화면의 고정 전화바를 덮지 않게 화면 밖으로 내린다.
// 하나 더: 틀은 안내 창을 높이 44px 바 위(아래에서 92px)에 맞춰 두었는데 번호가 든 바는 52px 라, 폰에서 안내 창이 올라오면 바 윗부분 8px 를 덮는다
// (2026-10-25 실측 · 390px 폰). 그래서 폰에서는 안내 창을 바 윗선(아래에서 100px)에 올린다. PC 는 바가 오른쪽 아래 둥근 단추라 틀 그대로 92px.
const BAR_PC_STYLE = '<style>.slide-up-banner,.scroll-banner{bottom:100px}.slide-up-banner:not(.show),.scroll-banner:not(.show){transform:translateY(calc(100% + 100px))}@media (min-width:768px){a.phone-bar.has-phone{max-width:none}.slide-up-banner,.scroll-banner{bottom:92px}}</style>';
const MARK = '<!-- ad-set-cube -->';
const CID = 'data-astro-cid-l5r5v5ku';
const AD_G = '<p class="ad-g" style="margin:10px 0 0;font-size:13px;font-weight:700;color:#fff;"><span class="ad-label" style="display:inline-block;margin-right:6px;padding:1px 8px;border:1px solid #fff;border-radius:4px;font-size:12px;">광고</span>19세 미만 출입 금지</p>';
const CALL = `<div style="text-align:center;padding:20px;"><a href="${TEL}" class="btn btn-primary btn-block">담당 ${NICK} ${PHONE} 전화하기</a></div>`;
const CLUB_URL = `${HOST}/venue/jangandong-hoppa-cube/`;

/* ── 세 쪽 글(받은 사실만 · 쪽마다 각도가 다르다: 전화로 물어볼 것 / 처음 가는 날 / 신림에서 장안동까지) ── */
const PAGES = [
  {
    slug: 'jangandong-hoppa-flex', card: 'jangandong-cube-a', gone: ['FLEX', '그래피티', '스니커즈', '랩 배틀'],
    title: '장안동호빠 큐브 예약 전화할 때 물어볼 것',
    desc: '장안동호빠 큐브에 예약 전화를 걸기 전에 오늘 영업 여부, 자리, 요금 셈법, 결제 수단을 어떤 차례로 물으면 되는지 적었습니다. 봉사료와 시간 추가를 따로 묻는 까닭, 챙겨 갈 신분증, 늦은 밤 집에 돌아가는 방법도 이어서 나옵니다.',
    h1: '장안동호빠 큐브 예약 전화 안내', crumb: '장안동호빠 큐브 예약 안내',
    sections: [
      { h: '장안동호빠 큐브는 어디에 있나?', ps: [
        '장안동호빠 큐브는 서울 동대문구 장안동에 있는 호빠다. 이 페이지에 실은 것은 가게 이름과 동네, 담당자 이름과 예약 번호까지다. 건물 이름이나 층수, 영업시간, 요금은 아직 받지 못해서 적지 않았다.',
        '처음 가는 길이라면 지도 앱에 가게 이름을 넣어 본 뒤 통화할 때 그 자리가 맞는지 다시 묻는다. 입구가 큰길 쪽인지 골목 안인지까지 들어 두면 밤에 헤매는 시간이 줄어든다.',
        '지도 앱에서 비슷한 이름이 여러 개 뜨거나 아예 안 뜰 때도 있다. 그럴 때는 화면에 나온 주소를 그대로 읽어 주고 맞는지 물으면 된다.',
      ] },
      { h: '전화를 걸면 무엇부터 물어볼까?', call: true, ps: [
        '통화가 길어지면 정작 궁금했던 것을 빠뜨리기 쉽다. 걸기 전에 메모장에 네 줄만 적어 두자. 오늘 문을 여는지, 몇 명까지 앉을 수 있는지, 도착할 시각에 자리가 있는지, 요금은 어떻게 셈하는지.',
        '이 넷을 먼저 들으면 나머지 질문은 대개 따라 나온다. 혼자 가는지 일행이 있는지도 처음에 말해 두면 안내가 한결 짧아진다.',
        '전화가 바로 연결되지 않으면 조금 있다가 다시 걸어 본다. 그래도 닿지 않으면 문자로 이름과 인원, 가고 싶은 시각을 남기고 답을 기다린다. 답을 듣기 전에 길을 나서면 문 앞에서 한참 서 있게 될지도 모른다.',
        '약속이 바뀌었을 때도 전화 한 통이면 된다. 도착이 늦어지거나 인원이 줄면 미리 알려 두어야 가게 쪽에서도 자리를 다시 짤 여유가 생긴다. 취소할 때 따로 정해 둔 규칙이 있는지는 처음 통화에서 물어 둔다.',
        '통화가 끝나면 날짜와 시각, 인원, 들은 요금을 메모장에 한 줄로 남겨 둔다. 당일에 헷갈리면 그 줄만 다시 보면 된다.',
        `예약 문의는 담당 ${NICK}이 받는다. 아래 단추를 누르면 바로 전화가 걸린다.`,
      ] },
      { h: '요금과 결제 수단은 어떻게 물어야 할까?', ps: [
        '\'얼마예요\' 한마디로는 답도 한 줄밖에 안 나온다. 기본으로 드는 돈이 무엇인지, 시간이 늘면 무엇이 더 붙는지, 봉사료나 부가세를 따로 받는지를 하나씩 나눠서 묻는다.',
        '봉사료를 따로 받는다면 몇 퍼센트인지, 시간 추가는 몇 분 단위로 셈하는지까지 물어 두면 계산할 때 숫자가 어긋날 일이 적다.',
        '들은 숫자는 그 자리에서 소리 내어 다시 읽고 맞는지 확인받는다. 받아 적은 숫자가 있으면 나중에 계산서와 맞춰 보기도 쉽다.',
        '계산서가 통화에서 들은 것과 다르면 어느 줄이 다른지 그 자리에서 차분히 묻는다. 요금표를 다시 보여 달라고 해도 괜찮다. 쓸 돈을 처음부터 정해 두었다면 예약할 때 그 금액을 먼저 말해 두는 방법도 있다.',
        '결제 수단도 미리 물어 두면 계산대 앞에서 서로 편하다. 카드가 되는지, 계좌이체를 받는지, 현금영수증을 끊어 주는지를 확인한다. 여럿이 나눠 낼 생각이라면 그 말도 첫 통화에서 해 둔다.',
        '현금을 따로 찾아 갈 생각이면 출발하기 전에 뽑아 둔다. 밤늦게는 은행 자동화기기 코너가 닫혀 있을 때가 있다. 편의점 기기를 쓰면 수수료가 붙기도 한다.',
      ] },
      { h: '신분증과 돌아가는 길', ps: [
        '술을 파는 곳이라 19세 미만은 들어갈 수 없다. 입구에서 나이를 확인하자고 할 때를 생각해 사진이 붙은 신분증을 챙긴다. 주민등록증이나 운전면허증이면 된다.',
        '술을 마실 생각이면 차는 집에 두고 나선다. 밤늦게 나오면 택시가 바로 안 잡힐 때가 있어서 택시 앱을 깔아 두거나 대리운전 번호를 저장해 둔다. 막차 시각은 노선마다 달라서 출발 전에 한 번 찾아본다.',
        '집에 갈 때 쓸 택시비는 따로 떼어 두면 마지막에 계산이 꼬이지 않는다.',
        '술은 마신 만큼 다음 날 몸에 남는다. 마실 양을 미리 정해 두고 중간중간 물을 함께 마신다.',
      ] },
    ],
    faqTitle: '전화 전에 궁금할 만한 것',
    faq: [
      ['영업시간은 어떻게 되나요?', '받은 영업시간 정보가 없습니다. 그날 문을 여는지와 몇 시까지 받는지는 전화로 물어보시면 됩니다.'],
      ['예약 없이 가도 되나요?', '자리 사정은 날마다 다를 수 있어서 출발하기 전에 전화로 한 번 확인하고 가시면 헛걸음을 덜 합니다.'],
      ['주차할 곳이 있나요?', '주차 정보는 아직 받지 못했습니다. 차를 가져가실 생각이라면 근처에 댈 곳이 있는지 통화할 때 함께 물어보세요.'],
      ['예약 전화는 언제쯤 걸면 되나요?', '정해진 시각은 받은 정보가 없습니다. 가려는 날보다 하루쯤 앞서 걸어 두시면 원하는 시각을 맞추기가 수월합니다.'],
      ['신분증은 꼭 있어야 하나요?', '19세 미만은 출입할 수 없어서 입구에서 나이를 확인할 때가 있습니다. 사진이 붙은 신분증을 챙겨 가세요.'],
    ],
  },
  {
    slug: 'jangandong-hoppa-cube', card: 'jangandong-cube-b', gone: ['정육면체', '기하학', '온더록', '포토존'],
    title: '장안동호빠 큐브 처음 가는 날 챙길 것',
    desc: '장안동호빠 큐브에 처음 가는 날 챙길 것을 적었습니다. 장안동 위치를 묻는 법, 가방에 넣을 것, 예산 잡는 법, 돌아오는 길까지 담았습니다. 혼자 갈 때와 일행과 갈 때 미리 정해 두면 편한 것도 따로 묶어 두었습니다.',
    h1: '장안동호빠 큐브 처음 가는 날', crumb: NAME,
    sections: [
      { h: '처음이라면 어디부터 볼까?', ps: [
        '장안동호빠 큐브는 서울 동대문구 장안동에 있다. 이 페이지에는 가게에서 받은 정보만 싣는다. 지금까지 받은 것은 이름과 동네, 담당 유현재 실장의 예약 번호다.',
        '실내가 어떻게 생겼는지, 몇 시에 문을 여는지는 아직 듣지 못했다. 모르는 것을 그럴듯하게 채워 넣지 않으려고 그 칸은 비워 두었다.',
        '이 페이지가 가게 소개보다 처음 가는 날 챙길 것에 무게를 둔 까닭이다. 아래를 차례대로 읽고 빠진 것만 통화로 물으면 된다.',
      ] },
      { h: '장안동은 어떻게 찾아갈까?', call: true, ps: [
        '지하철로 갈지 택시로 갈지는 출발하는 곳에 따라 다르다. 지도 앱에 장안동을 넣으면 걸리는 시간과 갈아탈 역이 나온다. 가게 자리는 담당자에게 전화로 한 번 더 묻는다.',
        '동네 이름만으로는 가게 자리를 바로 알기 어렵다. 통화할 때 가까운 지하철역이나 큰길 이름을 물어 두면 길을 잡기가 한결 쉽다.',
        '밤에 처음 가는 동네는 낮에 본 지도와 느낌이 다르다. 가까이 와서 건물을 못 찾겠으면 그 자리에서 전화를 걸어 주변에 보이는 간판을 말해 주면 길을 잡기 쉽다.',
        '통화로 건물 이름을 들었다면 지도 앱의 거리 사진으로 입구를 미리 봐 둔다. 낮에 한 번 눈에 익혀 두면 밤에 같은 골목을 두 번 도는 일이 줄어든다.',
        '택시를 탈 생각이면 몇 시에 부를지도 미리 정해 둔다. 주말 밤에는 차가 잘 안 잡힐 때가 있어서 조금 일찍 부른다.',
        '처음 가는 날이라고 먼저 말해 두면 묻고 싶은 것을 차례대로 짚어 가기 편하다.',
        `자리와 요금, 영업 여부는 담당 ${NICK}에게 물으면 된다. 단추를 누르면 통화가 연결된다.`,
      ] },
      { h: '가방에 넣어 갈 것은?', ps: [
        '사진이 붙은 신분증이 먼저다. 19세 미만은 출입할 수 없어서 입구에서 나이를 확인할 때가 있다. 휴대폰은 배터리를 넉넉히 채워 가고 보조 배터리가 있으면 같이 넣는다.',
        '카드 한 장과 약간의 현금도 챙긴다. 받는 결제 수단은 가게마다 달라서 통화할 때 미리 물어 두면 마음이 놓인다.',
        '휴대폰에는 담당자 번호를 이름과 함께 저장해 둔다. 길에서 급하게 찾을 때 통화 기록을 뒤지느라 헤매지 않는다.',
        '겉옷을 맡길 곳이 있는지는 모르니 가볍게 입고 간다. 귀중품은 꼭 필요한 것만 들고 나선다.',
      ] },
      { h: '혼자든 여럿이든 정해 둘 것', ps: [
        '혼자 가도 되는지, 몇 명까지 한자리에 앉을 수 있는지는 예약할 때 물으면 바로 답이 나온다. 일행이 있다면 인원과 도착할 시각을 함께 말해 둔다. 늦게 합류하는 사람이 있으면 그 사람 이름도 알려 두면 입구에서 덜 헤맨다.',
        '일행끼리는 출발 전에 몇 시쯤 일어날지, 돈은 어떻게 나눌지를 정해 둔다. 막상 자리에 앉으면 그 얘기를 꺼내기가 어색해진다.',
        '함께 가는 사람이 술을 못 마신다면 그 이야기도 예약할 때 해 둔다. 마실 거리를 따로 고를 수 있는지 미리 알면 서로 편하다.',
        '혼자 간다면 도착했다는 소식과 돌아갈 시각을 가까운 사람에게 남겨 둔다.',
        '요금표를 받지 못해서 이 페이지에는 숫자를 적지 않았다. 예산은 통화할 때 들은 기본 요금에 시간이 늘어날 때 붙는 돈을 더해서 잡는다. 정해 둔 금액을 넘기면 일어나겠다고 스스로 선을 그어 두면 계산할 때 놀랄 일이 적다.',
        '예약할 때 들은 요금과 오늘 쓸 수 있는 돈을 견주어 보고 모자라면 갈 날을 미루는 것도 방법이다. 계산서를 받으면 항목을 하나씩 짚어 보고 모르는 줄은 무슨 돈인지 물어본다.',
        '술을 마신 날은 운전대를 잡지 않는다. 늦은 시각에는 택시 앱으로 미리 차를 부르거나 대리운전을 쓴다. 집에 닿으면 함께 간 사람끼리 잘 들어갔다고 한 줄씩 남겨 둔다.',
        '다음 날 일정이 있다면 끝낼 시각을 미리 정해 둔다. 빈속으로 가지 말고 저녁을 가볍게라도 먹고 나선다.',
      ] },
    ],
    faqTitle: '큐브에 대해 자주 묻는 것',
    faq: [
      ['장안동호빠 큐브는 어떤 곳인가요?', '서울 동대문구 장안동에 있는 호빠입니다. 실내 모습이나 공연 같은 자세한 정보는 아직 받지 못해서 이 페이지에 적지 않았습니다.'],
      ['주차가 되나요?', '주차 정보는 받지 못했습니다. 차를 가져가실 거라면 예약 전화에서 함께 물어보시고 술을 드실 날에는 차를 두고 가세요.'],
      ['여럿이 함께 가도 되나요?', '단체 손님을 받는지는 받은 정보가 없습니다. 인원과 도착 시각을 정한 뒤 전화로 자리가 되는지 물어보세요.'],
      ['옷차림 규정이 있나요?', '옷차림 규정은 받은 정보가 없습니다. 신경 쓰이신다면 예약하실 때 함께 물어보세요.'],
      ['도착하면 무엇부터 하나요?', '입구에서 예약한 이름을 말씀하시면 됩니다. 나이를 확인할 수 있게 신분증을 미리 꺼내 두세요.'],
    ],
  },
  {
    slug: 'sinlim-hoppa-race', card: 'jangandong-cube-c', gone: ['레이스', '체커', '하이볼', '레이싱'],
    title: '신림호빠 찾는 분께 장안동 큐브 소개',
    desc: '신림에서 호빠를 찾다가 이 페이지에 오셨다면 장안동호빠 큐브를 소개합니다. 신림과 장안동 사이 거리, 출발 전 확인할 것, 돌아오는 길을 적었습니다. 한강을 건너는 먼 길이라 영업과 자리를 전화로 먼저 묻는 편이 낫습니다.',
    h1: '신림호빠 찾는 분께 장안동 큐브 소개', crumb: '신림호빠 찾는 분께',
    sections: [
      { h: '신림호빠를 찾다가 이 페이지에 왔다면', ps: [
        '신림에서 호빠를 찾다가 이 페이지에 들어왔다면 먼저 알아 둘 것이 있다. 여기서 소개하는 장안동호빠 큐브는 신림이 아닌 서울 동대문구 장안동에 있다. 거리가 꽤 되니 아래 내용을 읽고 갈지 말지를 정하면 된다.',
        '큐브에 대해 받은 정보는 이름, 동네, 담당자, 예약 번호 넷이다. 영업시간과 요금, 실내 모습은 아직 받지 못해서 비워 두었다. 모르는 칸은 전화로 물어서 채운다.',
        '신림에서 장안동까지는 마음먹고 가야 하는 거리다. 그만큼 미리 묻고 정해 둘 것이 많아서 아래에 차례대로 적었다.',
        '가까운 곳을 바란다면 신림 쪽 가게를 따로 찾아본다. 조금 멀어도 괜찮다면 아래를 이어서 읽으면 된다.',
      ] },
      { h: '신림에서 장안동은 얼마나 걸릴까?', ps: [
        '신림은 관악구, 장안동은 동대문구라 서울을 남서쪽에서 북동쪽으로 가로지르는 셈이다. 한강을 건너야 하고 지하철로 가면 적어도 한 번은 갈아탄다.',
        '걸리는 시간은 출발 시각과 길 사정에 따라 크게 달라진다. 지도 앱에서 신림역과 장안동을 넣어 보면 지하철과 택시로 걸리는 시간이 함께 나온다. 그 숫자를 보고 나서 출발 시각을 정한다.',
        '택시로 가면 서울을 가로지르는 거리라 요금 부담이 적지 않다. 앱에서 예상 요금을 미리 확인하고 지하철과 견주어 고른다. 퇴근 시간대에는 같은 길도 더 오래 걸린다.',
        '지하철은 갈아타는 역에서 걷는 시간이 생각보다 길다. 앱에 나온 시간보다 넉넉하게 잡고 집을 나선다.',
      ] },
      { h: '멀리 가는 날 출발 전에 확인할 것은?', call: true, ps: [
        '거리가 멀수록 헛걸음은 아깝다. 집을 나서기 전에 담당자에게 전화해서 오늘 문을 여는지, 도착할 시각에 자리가 있는지를 먼저 묻는다. 신림에서 출발한다고 말해 두면 도착 시각을 맞추기도 수월하다.',
        '요금도 이때 같이 묻는다. 기본으로 드는 돈과 시간이 늘면 더 붙는 돈을 나눠서 듣고 받아 적어 둔다.',
        '같이 갈 사람이 있다면 어디서 만날지도 거리를 따져 정한다. 신림에서 함께 출발할지 장안동 근처에서 만날지에 따라 집을 나설 시각이 달라진다.',
        '오늘 영업한다는 답을 들었더라도 출발하기 직전에 문자로 한 번 더 확인해 두면 든든하다. 가는 길에 늦어지면 바로 전화로 알린다. 길이 막힌다고 미리 말해 두면 도착했을 때 자리 때문에 서로 곤란할 일이 줄어든다.',
        '사진이 붙은 신분증은 꼭 챙긴다. 19세 미만은 출입할 수 없는 곳이라 입구에서 나이를 확인할 때가 있다. 카드가 되는지 현금이나 계좌이체만 받는지도 통화할 때 물어 두면 계산이 빨라진다.',
        '현금이 필요하다는 답을 들었다면 신림에서 미리 찾아 간다. 낯선 동네에서 밤늦게 자동화기기를 찾으려면 시간이 든다.',
        '먼 길이라 휴대폰 배터리가 금방 닳는다. 지도 앱과 택시 앱을 오래 켜 두게 되니 보조 배터리도 넣어 간다.',
        `장안동호빠 큐브의 예약 문의는 담당 ${NICK}이 받는다. 번호를 누르면 곧바로 통화로 이어진다.`,
      ] },
      { h: '돌아오는 길은 어떻게 할까?', ps: [
        '신림까지 돌아가는 길은 밤이 깊을수록 고르기가 어렵다. 지하철 막차는 노선과 요일에 따라 다르니 출발 전에 시각을 찾아 두고 늦어지면 택시나 대리운전을 쓴다. 술을 마신 날은 운전하지 않는다.',
        '여럿이 갔다면 돌아가는 방향이 같은 사람끼리 묶어 택시를 타는 방법도 있다. 택시를 기다리는 동안에는 밝은 큰길 쪽에 서 있는다.',
        '택시 안에서는 목적지를 한 번 더 말하고 지도 앱으로 가는 길을 같이 본다. 밤늦은 시각일수록 집 앞까지 가는지 확인하고 내린다.',
        '이튿날 출근이 있다면 자리에서 일어날 시각을 먼저 정하고 그 시각에 맞춰 택시를 부른다.',
      ] },
    ],
    faqTitle: '신림에서 가기 전에 묻는 것',
    faq: [
      ['장안동호빠 큐브는 신림에 있나요?', '아닙니다. 서울 동대문구 장안동에 있습니다. 신림에서 가시려면 한강을 건너 지하철을 한 번 이상 갈아타셔야 합니다.'],
      ['신림에서 가려면 얼마나 걸리나요?', '출발 시각과 교통 사정에 따라 달라서 정해진 숫자를 적지 않았습니다. 지도 앱으로 미리 확인해 보세요.'],
      ['영업시간이 정해져 있나요?', '영업시간은 받은 정보가 없습니다. 몇 시에 문을 열고 몇 시까지 받는지는 담당자에게 직접 물어보세요.'],
      ['신림에도 같은 가게가 있나요?', '신림에 있는 지점에 대한 정보는 받지 못했습니다. 이 페이지에서 안내하는 곳은 장안동에 있는 장안동호빠 큐브 한 곳입니다.'],
      ['지하철이 끊기면 어떻게 돌아가나요?', '택시나 대리운전을 쓰셔야 합니다. 늦게까지 머물 생각이라면 돌아갈 방법을 출발 전에 정해 두세요.'],
    ],
  },
];

/* ── 도구 ── */
const A = '(?: data-astro-cid-[a-z0-9]+)*'; // Astro 범위 속성(있어도 없어도)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const visibleOf = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
function ident(h) {
  const g = (re) => { const m = h.match(re); return m ? m[1] : null; };
  return { canonical: g(/<link rel="canonical" href="([^"]*)"/), ogurl: g(/<meta property="og:url" content="([^"]*)"/) };
}
function cardOf(prefix) {
  const ogDir = join(ROOT, 'og');
  if (!existsSync(ogDir)) stop(`카드 폴더가 없음: ${ogDir}`);
  const re = new RegExp(`^${esc(prefix)}-[0-9a-f]{8}\\.png$`);
  const cards = readdirSync(ogDir).filter((f) => re.test(f));
  if (cards.length !== 1) stop(`카드(${prefix}-<8자리>.png)가 ${ogDir} 에 1개여야 하는데 ${cards.length}개: ${cards.join(', ')}`);
  return cards[0];
}
function mainHtml(p, cardPath) {
  const secs = p.sections.map((s) => `<h2 class="tp-title" ${CID}>${s.h}</h2> ` + s.ps.map((t) => `<p class="tp-desc" ${CID}>${t}</p>`).join('') + (s.call ? CALL : '')).join(' ');
  const faq = `<h2 class="tp-title" ${CID}>${p.faqTitle}</h2> ` + p.faq.map(([q, a]) => `<div class="faq-item" ${CID}> <div class="faq-q" ${CID}>${q}</div> <div class="faq-a" ${CID}>${a}</div> </div>`).join('');
  return `   <section class="vh" style="background:linear-gradient(135deg,#E11D48,#FB7185)" ${CID}> <nav class="bc" ${CID}> <a href="/" target="_blank" rel="noopener noreferrer" ${CID}>홈</a><span ${CID}>›</span> <a href="/hoppa/" target="_blank" rel="noopener noreferrer" ${CID}>호빠</a><span ${CID}>›</span> <span class="bc-cur" ${CID}>${p.crumb}</span> </nav> <div class="vh-badge" ${CID}>호빠</div> ${AD_G}<h1 ${CID}>${p.h1}</h1>   <img src="${cardPath}" alt="${attr(ALT)}" width="1200" height="1200" class="vh-img" style="aspect-ratio:1/1;height:auto;" ${CID}> </section> <div class="tab-panel active" id="tab-info" ${CID}> ${secs} ${faq} </div> ${MARK}<p class="ad-notice" style="margin:24px 0 8px;padding:12px 16px;font-size:13px;line-height:1.6;color:var(--text-secondary);text-align:center;border-top:1px solid var(--border);">${NOTICE}</p>`;
}
function ldOf(p, url, cardUrl) {
  return [
    null, null, // Organization · WebSite 는 처음 판 그대로(아래에서 채움)
    { '@context': 'https://schema.org', '@type': 'NightClub', name: NAME, description: '서울 동대문구 장안동에 있는 호빠. 영업시간과 요금은 받은 정보가 없어 예약 전화로 확인한다.', image: cardUrl, telephone: LD_TEL, address: { '@type': 'PostalAddress', addressLocality: '동대문구 장안동', addressRegion: '서울', addressCountry: 'KR' }, url: CLUB_URL },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: HOST },
      { '@type': 'ListItem', position: 2, name: '호빠', item: `${HOST}/hoppa/` },
      { '@type': 'ListItem', position: 3, name: p.crumb, item: url },
    ] },
  ];
}
function verify(h, p, cardPath, cardUrl) {
  const bad = [];
  const has = (s, label) => { if (!h.includes(s)) bad.push(label); };
  has(`<title>${p.title}</title>`, '제목');
  has(`<meta name="description" content="${attr(p.desc)}">`, '설명');
  has(`<meta property="og:title" content="${attr(p.title)}">`, 'og:title');
  has(`<meta property="og:image" content="${cardUrl}">`, 'og:image');
  has(`<meta property="og:image:alt" content="${attr(ALT)}">`, 'og:image:alt');
  has(`<meta name="twitter:image" content="${cardUrl}">`, 'twitter:image');
  has(`href="${TEL}" class="phone-bar has-phone"`, '전화바 tel');
  has(`>${BAR_TEXT}</a>`, '전화바 글자');
  has(`${BAR_PC_STYLE}</head>`, 'PC 전화바 폭');
  has(`<img src="${cardPath}" alt="${attr(ALT)}" width="1200" height="1200"`, '본문 카드 img');
  has(`"telephone":"${LD_TEL}"`, 'JSON-LD telephone');
  has(NOTICE, '관계 고지');
  has(CALL, '본문 전화 단추');
  if (!new RegExp(`<span class="ad-label"[^>]*>광고</span>19세 미만 출입 금지</p><h1\\b[^>]*>${esc(p.h1)}</h1>`).test(h)) bad.push('h1 바로 앞 광고 표시');
  if ((h.match(/<h1\b/g) || []).length !== 1) bad.push('h1 이 하나가 아님');
  if ((h.match(/<main\b/g) || []).length !== 1) bad.push('main 이 하나가 아님');
  if (/id="(toast|varReward|fomoCounter)"/.test(h)) bad.push('지어낸 알림 칸 남음');
  const vis = visibleOf(h);
  // 옛 글 검사는 보이는 글자 · 머리 속성 · 구조화 자료만 본다(틀 공용 스크립트 속 알림 문구 목록은 이 쪽에서 알림 칸을 빼서 화면에 안 나옴)
  const seen = h.replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, ' ');
  for (const w of p.gone) if (seen.includes(w)) bad.push(`옛 글 「${w}」 남음`);
  const phoneCount = vis.split(PHONE).length - 1;
  if (phoneCount < 2 || phoneCount > 3) bad.push(`보이는 번호 ${phoneCount}번(2~3번이어야 함)`);
  if (!vis.includes(NICK)) bad.push('닉네임 안 보임');
  if (/01[016789][-. ]?\d{3,4}[-. ]?\d{4}/.test(p.title + p.desc + p.h1) || /광고문의|카톡|besta12/.test(p.title + p.h1)) bad.push('제목·설명·h1 에 연락처');
  return bad;
}

/* ── 세 쪽 다 고친 뒤에만 쓴다 ── */
const outs = [];
let already = 0;
for (const p of PAGES) {
  const file = join(ROOT, 'venue', p.slug, 'index.html');
  if (!existsSync(file)) stop(`쪽 파일이 없음: ${file}`);
  const url = `${HOST}/venue/${p.slug}/`;
  const card = cardOf(p.card);
  const cardPath = `/og/${card}`;
  const cardUrl = `${HOST}${cardPath}`;
  const before = readFileSync(file, 'utf8');
  const id0 = ident(before);
  if (id0.canonical !== url || id0.ogurl !== url) stop(`${p.slug} canonical·og:url 이 예상과 다름: ${id0.canonical} · ${id0.ogurl}`);
  if (before.includes(MARK)) {
    const bad = verify(before, p, cardPath, cardUrl);
    if (bad.length) stop(`${p.slug} 표식은 있는데 빠진 자리: ${bad.join(' · ')}`);
    already++; continue;
  }
  let h = before;
  const missing = [];
  const once = (label, re, repl) => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const n = (h.match(g) || []).length;
    if (n !== 1) { missing.push(`${label}(찾은 수 ${n})`); return; }
    h = h.replace(new RegExp(re.source, re.flags.replace('g', '')), typeof repl === 'string' ? () => repl : repl);
  };
  const removeEl = (label, re) => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const all = [...h.matchAll(g)];
    if (all.length !== 1) { missing.push(`${label}(찾은 수 ${all.length})`); return; }
    const start = all[0].index;
    const tag = h.slice(start).match(/^<([a-zA-Z][a-zA-Z0-9]*)\b/)[1].toLowerCase();
    const tr = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi'); tr.lastIndex = start;
    let depth = 0, end = -1, m;
    while ((m = tr.exec(h))) { if (m[1] === '/') { depth--; if (depth === 0) { end = m.index + m[0].length; break; } } else if (!m[0].endsWith('/>')) depth++; }
    if (end < 0) { missing.push(`${label}(닫는 태그 못 찾음)`); return; }
    h = h.slice(0, start) + h.slice(end);
  };
  // ① 머리 — 제목 · 설명 · og · twitter (주소 칸은 그대로)
  once('title', /<title>[^<]*<\/title>/, `<title>${p.title}</title>`);
  once('description', /<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(p.desc)}">`);
  once('og:title', /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(p.title)}">`);
  once('og:description', /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(p.desc)}">`);
  once('og:image', /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${cardUrl}">`);
  once('og:image:width', /<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1200">');
  once('og:image:height', /<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="1200">');
  once('og:image:alt', /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${attr(ALT)}">`);
  once('twitter:card', /<meta name="twitter:card" content="[^"]*">/, '<meta name="twitter:card" content="summary_large_image">');
  once('twitter:title', /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${attr(p.title)}">`);
  once('twitter:description', /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${attr(p.desc)}">`);
  once('twitter:image', /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${cardUrl}">`);
  once('머리 끝(PC 전화바 폭)', /<\/head>/, `${BAR_PC_STYLE}</head>`);
  // ② JSON-LD — Organization · WebSite 는 그대로, NightClub = 큐브(번호 · 새 카드 · 확인된 동네) · FAQPage = 보이는 문답 · 빵부스러기 = 새 이름
  {
    const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (lds.length !== 1) missing.push(`JSON-LD 덩이(찾은 수 ${lds.length})`);
    else {
      let data = null; try { data = JSON.parse(lds[0][1]); } catch { missing.push('JSON-LD 읽기'); }
      if (data) {
        const types = (Array.isArray(data) ? data : [data]).map((n) => n && n['@type']).join(',');
        if (types !== 'Organization,WebSite,NightClub,FAQPage,BreadcrumbList') missing.push(`JSON-LD 짜임(${types})`);
        else {
          const nu = ldOf(p, url, cardUrl); nu[0] = data[0]; nu[1] = data[1];
          const out = JSON.stringify(nu).replace(/<\//g, '<\\/');
          h = h.slice(0, lds[0].index) + `<script type="application/ld+json">${out}</script>` + h.slice(lds[0].index + lds[0][0].length);
        }
      }
    }
  }
  // ③ <main> 안 → 새 글(히어로 · 광고 표시 · 카드 · 소제목 · 담당 전화 단추 · 문답 · 관계 고지)
  {
    const ms = [...h.matchAll(/<main data-astro-cid-37fxchfa>/g)];
    const ends = [...h.matchAll(/<\/main>/g)];
    if (ms.length !== 1 || ends.length !== 1) missing.push(`main(여는 ${ms.length} · 닫는 ${ends.length})`);
    else {
      const a = ms[0].index + ms[0][0].length; const b = ends[0].index;
      if (!h.slice(a, b).includes('<section class="vh"')) missing.push('main 안 히어로');
      else h = h.slice(0, a) + mainHtml(p, cardPath) + h.slice(b);
    }
  }
  // ④ 아래 고정 바 → tel 바(이 틀의 전화 있는 꼴 phone-bar has-phone · 선례와 같은 줄)
  once('아래 고정 바', new RegExp(`<a href="https://nolcool\\.com" target="_blank" rel="noopener noreferrer" class="phone-bar no-phone"(${A})>[^<]*</a>`),
    (_m, cid) => `<a href="${TEL}" class="phone-bar has-phone" style="font-size:clamp(13px,3.9vw,18px);letter-spacing:0;white-space:nowrap;"${cid}>${BAR_TEXT}</a>`);
  // ⑤ 틀 밖의 지어낸 알림 셋(지금 N명 탐색 중 · 예약 문의 들어옴 · 떠오르는 혜택) — 선례처럼 이 쪽에서만 뺀다(틀 스크립트가 없으면 넘어가게 짜여 있음)
  removeEl('지금 N명 탐색 중', new RegExp(`<span style="margin-left:12px;color:var\\(--accent\\);font-weight:600;"${A} id="fomoCounter"${A}>`));
  removeEl('예약 문의 들어옴 알림', new RegExp(`<div class="toast"${A} id="toast"${A}>`));
  removeEl('떠오르는 알림', new RegExp(`<div class="var-reward"${A} id="varReward"${A}>`));

  if (missing.length) stop(`${p.slug} 못 찾은 자리 ${missing.length}곳 — ${missing.join(' · ')} (세 쪽 다 쓰지 않음)`);
  const id1 = ident(h);
  for (const k of Object.keys(id0)) if (id0[k] !== id1[k]) stop(`${p.slug} ${k} 가 바뀜 (세 쪽 다 쓰지 않음)`);
  const bad = verify(h, p, cardPath, cardUrl);
  if (bad.length) stop(`${p.slug} 넣은 뒤 확인에서 빠진 자리: ${bad.join(' · ')} (세 쪽 다 쓰지 않음)`);
  outs.push({ file, h, before, card, p });
}
for (const o of outs) writeFileSync(o.file, o.h);
for (const o of outs) console.log(`${TAG} 넣음 — ${o.file} · 카드 ${o.card} · ${o.before.length}B → ${o.h.length}B`);
if (already) console.log(`${TAG} 이미 넣음 ${already}쪽 — 그대로 둠`);
