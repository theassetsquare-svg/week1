#!/usr/bin/env node
// 가게 전용 사이트(dd) — 빌드 맨 끝 단계(ad-set-cube.mjs 다음). 구글69-1(2026-11-07 · 대표님 00:23·17:16):
//   ① /venue/geondae-hoppa-w/ = 건대호빠 광고주 세트(담당 유현재 실장 · 장안동호빠 큐브와 같은 번호 · 대표님 원문 2026-11-07 00:23)
//   ② /venue/busan-hoppa-star/ · -aura/ · -menz/ · -ggantappiya/ = 광고문의 카드(번호 0)
//   ③ /venue/jangandong-hoppa-cube/ = 아래 광고 안내 창 둘(「더 많은 정보가 기다리고 있습니다」「여기서 끝이 아닙니다!」) 빼기
//   다섯 쪽의 <main> 안은 지어낸 묘사(조명·칵테일·가짜 후기·가짜 혜택·확인 안 된 영업시간)뿐이라 받은 사실만으로 새로 쓴다.
//   그림: 쪽마다 1:1 안내 카드 한 장(본문 첫 그림 · og · twitter · JSON-LD 같은 파일) · alt = 그려진 것(번호 0) · 같은 그림을 다섯 번 되풀이하던 칸과 가짜 alt 는 뺀다.
//   주소 · canonical · og:url 은 바꾸지 않는다(앞뒤를 견줘 다르면 종료 1). 찾을 자리를 하나라도 못 찾으면 아무 쪽도 쓰지 않고 종료 1(반쪽 0). 다시 돌리면 확인만(멱등).
// 쓰는 법: node scripts/ad-set-g69.mjs [뿌리 폴더]   (기본 dist)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || process.env.AD_SET_ROOT || 'dist';
const HOST = 'https://dd.nolcool.com';
const NICK = '유현재 실장';
const PHONE = '010-7674-8310';
const TAG = '[ad-set-g69]';
function stop(msg) { console.error(`${TAG} 실패 — ${msg}`); process.exit(1); }
if (!/^010-\d{4}-\d{4}$/.test(PHONE)) stop('번호 꼴');
const TEL = `tel:${PHONE.replace(/\D/g, '')}`;
const LD_TEL = `+82-${PHONE.slice(1)}`;
const MARK = '<!-- ad-set-g69 -->';
const CID = 'data-astro-cid-l5r5v5ku';
const BAR_PC_STYLE = '<style>.slide-up-banner,.scroll-banner{bottom:100px}.slide-up-banner:not(.show),.scroll-banner:not(.show){transform:translateY(calc(100% + 100px))}@media (min-width:768px){a.phone-bar.has-phone{max-width:none}.slide-up-banner,.scroll-banner{bottom:92px}}</style>';
const AGE = (ad) => `<p class="ad-g" style="margin:10px 0 0;font-size:13px;font-weight:700;color:#fff;">${ad ? '<span class="ad-label" style="display:inline-block;margin-right:6px;padding:1px 8px;border:1px solid #fff;border-radius:4px;font-size:12px;">광고</span>' : ''}19세 미만 출입 금지</p>`;
const CALL = `<div style="text-align:center;padding:20px;"><a href="${TEL}" class="btn btn-primary btn-block">담당 ${NICK} ${PHONE} 전화하기</a></div>`;
const NOTICE = `이 페이지는 광고이며, 업소 제공 정보를 받아 실었습니다(담당 ${NICK}). 확인일 2026-11-07. 실린 내용은 사정에 따라 바뀔 수 있습니다.`;
const INQ = '<p class="ad-notice" style="margin:24px 0 8px;padding:12px 16px;font-size:13px;line-height:1.6;color:var(--text-secondary);text-align:center;border-top:1px solid var(--border);">이 가게의 주소·영업시간·요금은 아직 확인하지 못했습니다. 가게 쪽에서 정보를 보내 주시면 확인한 뒤에 싣습니다 — 광고문의 카톡 besta12.</p>';
const HUB = '<p class="tp-desc" ' + CID + '>부산 호빠 가게 목록과 안내 글은 <a href="https://nolcool.com/region/%EB%B6%80%EC%82%B0/hoppa/" target="_blank" rel="noopener">놀쿨 부산호빠 모아 보기</a>에 모여 있다.</p>';

const PAGES = [
  {
    slug: 'geondae-hoppa-w', ad: true, name: '건대호빠', card: 'geondae-hoppa-card', gone: ['하이볼 시리즈', '블랙 앤 화이트', '인사이더', '사운드 시스템'],
    title: '건대호빠 예약 전 유현재 실장과 미리 맞출 것',
    desc: '건대호빠 예약은 담당 유현재 실장이 전화로 받습니다. 가게 자리와 영업시간, 요금은 아직 받지 못해 적지 않았고, 통화할 때 무엇을 어떤 차례로 맞추면 되는지와 일행과 미리 정해 둘 것, 늦은 밤 건대에서 돌아가는 방법을 적었습니다.',
    crumb: '건대호빠',
    sections: [
      { h: '이 페이지에 실은 것', ps: [
        '건대호빠는 건대 쪽 호스트바다. 지금까지 가게에서 받은 것은 이름과 담당자, 예약 번호까지다. 담당은 유현재 실장이고, 장안동호빠 큐브 예약을 받는 사람과 같은 사람이라 번호도 같다.',
        '건물 이름과 층, 영업시간, 요금은 아직 받지 못했다. 예전 이 자리에 있던 실내 묘사와 후기, 혜택 문구는 어디서 나온 말인지 확인이 안 돼 지웠다. 모르는 칸은 통화로 물어서 채우면 된다.',
      ] },
      { h: '통화에서 맞출 것', call: true, ps: [
        '번호가 장안동 큐브와 같으니 처음에 "건대 쪽 가게로 가려고 한다"고 먼저 말해 두는 게 좋다. 그래야 어느 가게 이야기인지 서로 헷갈리지 않는다.',
        '그다음은 가는 날짜와 시각, 인원이다. 가게 자리는 지도 앱에 찍을 수 있게 건물 이름까지 받아 적고, 가까운 출구나 큰길도 같이 물어 둔다.',
        '요금은 기본으로 드는 돈과 시간이 늘면 붙는 돈을 나눠서 듣는다. 카드가 되는지, 계좌이체를 받는지도 이때 확인한다.',
        `예약 문의는 담당 ${NICK}이 받는다. 아래 단추를 누르면 바로 전화가 걸린다.`,
      ] },
      { h: '일행과 먼저 정해 둘 것', ps: [
        '여럿이 간다면 누가 대표로 예약 전화를 걸지부터 정한다. 한 사람이 받은 내용을 단톡방에 그대로 올려 두면 같은 질문을 두 번 할 일이 없다.',
        '돈은 똑같이 나눌지 각자 낼지, 몇 시쯤 일어날지도 출발 전에 이야기해 둔다. 자리에 앉은 뒤에 꺼내면 말하기가 어색해진다.',
        '술을 못 마시는 사람이 있으면 그것도 예약할 때 같이 말해 둔다.',
      ] },
      { h: '통화가 바로 안 될 때', ps: [
        '전화를 바로 못 받을 때도 있다. 몇 번 울려도 안 받으면 문자로 이름과 가려는 날짜, 인원을 남겨 두고 기다린다. 같은 번호로 연달아 여러 번 거는 것보다 답이 빨리 온다.',
        '답을 받으면 들은 내용을 그 자리에서 메모해 둔다. 시각과 인원, 요금 이야기는 나중에 다시 묻기 번거롭다.',
      ] },
      { h: '처음 가는 날 시간 짜기', ps: [
        '처음이라면 사람이 몰리기 전에 조금 일찍 들어가는 편이 이야기 나누기 편하다. 몇 시쯤이 한산한지는 통화할 때 물어보면 된다.',
        '얼마나 있을지 대략 정해 두면 돈도 시간도 가늠하기 쉽다. 시간이 늘면 붙는 돈을 앞에서 들어 두었으니 그 금액을 기준으로 일어날 시각을 잡는다.',
        '자리에서 듣는 요금이 통화로 들은 것과 다르면 그 자리에서 바로 물어본다. 계산할 때 따지는 것보다 훨씬 덜 어색하다.',
      ] },
      { h: '건대에서 돌아가는 길', ps: [
        '주말 밤 건대입구 쪽은 택시를 기다리는 사람이 많다. 끝낼 시각이 정해지면 택시 앱으로 조금 일찍 부르거나, 지하철 막차 시각을 미리 찾아 둔다.',
        '건대입구역은 2호선과 7호선이 같이 서는 역이다. 집 쪽으로 가는 노선이 어느 쪽인지 보고 그 노선의 막차를 따로 찾아 둔다.',
        '술을 마신 날은 운전하지 않는다. 사진이 붙은 신분증은 꼭 챙긴다. 19세 미만은 들어갈 수 없는 곳이라 입구에서 나이를 확인할 때가 있다.',
      ] },
    ],
    faqTitle: '건대호빠에 대해 묻는 것',
    faq: [
      ['건대호빠 예약은 누가 받나요?', `담당 ${NICK}이 전화로 받습니다. 장안동호빠 큐브와 같은 번호라 통화할 때 건대 쪽 가게라고 먼저 말씀해 주세요.`],
      ['영업시간은 어떻게 되나요?', '받은 영업시간 정보가 없습니다. 가려는 날 문을 여는지 전화로 확인해 주세요.'],
      ['정확한 위치는 어디인가요?', '건물 이름과 층은 아직 받지 못했습니다. 예약하실 때 지도에 찍을 수 있게 물어보세요.'],
      ['신분증이 있어야 하나요?', '19세 미만은 출입할 수 없어 입구에서 나이를 확인할 때가 있습니다. 사진이 붙은 신분증을 챙겨 주세요.'],
    ],
  },
  {
    slug: 'busan-hoppa-star', ad: false, name: '부산호빠 스타', card: 'busan-hoppa-star-card', gone: ['별 모양', '감귤 사워', '루프탑', '인사이더'],
    title: '부산호빠 스타 가기 전 확인된 것과 아직 모르는 것',
    desc: '부산호빠 스타에 대해 이 사이트가 확인한 것과 아직 확인하지 못한 것을 나눠 적었습니다. 주소와 영업시간, 요금은 받지 못해 비워 두었고, 정보가 적은 가게를 찾아가기 전에 지도 앱과 간판으로 먼저 확인할 것을 정리했습니다.',
    crumb: '부산호빠 스타',
    sections: [
      { h: '확인된 것', ps: [
        '부산호빠 스타는 이 사이트의 부산 호빠 목록에 이름이 올라 있는 가게다. 확인된 것은 거기까지다.',
        '주소와 영업시간, 요금, 연락처는 가게에서 받은 적이 없다. 예전 이 자리에 있던 조명과 칵테일 이야기, 후기와 혜택, 영업시간표는 누가 확인한 것이 아니어서 걷어냈다.',
      ] },
      { h: '정보가 적은 가게를 찾아갈 때', ps: [
        '먼저 지도 앱에 가게 이름을 넣어 본다. 같은 이름이 여러 곳 뜨면 주소와 마지막으로 고친 날짜를 견줘 보고, 아무것도 안 뜨면 이름이 바뀌었거나 문을 닫았을 수도 있다.',
        '거리 사진으로 간판을 미리 봐 두면 밤에 골목을 두 번 도는 일이 줄어든다. 간판이 사진과 다르면 그 자리에서 다시 찾아보는 게 낫다.',
        '영업 여부는 가게에 직접 확인하는 것 말고는 방법이 없다. 연락처를 찾았다면 출발 전에 오늘 문을 여는지부터 묻는다.',
      ] },
      { h: '인터넷 글을 볼 때 걸러 볼 것', ps: [
        '올라온 글이 많다고 정보가 맞는 것은 아니다. 글마다 적힌 날짜를 먼저 보고, 한두 해 지난 글이면 지금은 다를 수 있다고 생각하는 편이 안전하다.',
        '같은 가게를 두고 글마다 번호가 다르면 그중 하나는 예전 번호이거나 다른 가게일 수 있다. 가장 최근 글의 번호로 걸어 보고, 받은 사람에게 가게 이름을 한 번 더 묻는다.',
        '요금이 유난히 싸다고 적혀 있으면 한 번 더 의심해 본다. 가서 듣는 금액은 글과 다를 수 있다.',
      ] },
      { h: '부산에서 약속 잡을 때', ps: [
        '부산은 해운대와 서면, 광안리처럼 밤에 사람이 모이는 동네끼리 거리가 꽤 된다. 가게가 어느 동네인지 모르면 모일 곳부터 정하기 어렵다.',
        '동네를 알게 되면 가까운 도시철도역과 출구를 지도 앱으로 찾아 둔다. 밤에는 같은 골목도 낮과 다르게 보여서 미리 봐 둔 출구 번호가 길잡이가 된다.',
      ] },
      { h: '가게를 운영하신다면', ps: [
        '부산호빠 스타를 운영하는 분이라면 주소와 영업시간, 예약 연락처를 보내 주시면 확인한 뒤 이 페이지에 싣는다. 확인하지 못한 내용은 싣지 않는다.',
      ] },
    ],
    faqTitle: '부산호빠 스타에 대해 묻는 것',
    faq: [
      ['부산호빠 스타는 어디에 있나요?', '주소를 받지 못해 적지 않았습니다. 지도 앱에서 이름으로 찾아보시고, 가게에 직접 확인해 주세요.'],
      ['영업시간은 몇 시부터인가요?', '확인한 영업시간이 없습니다. 예전에 적혀 있던 시간표는 근거가 없어 뺐습니다.'],
      ['가게 정보를 고치고 싶으면 어떻게 하나요?', '광고문의 카톡 besta12 로 보내 주시면 확인한 뒤 고칩니다.'],
    ],
  },
  {
    slug: 'busan-hoppa-aura', ad: false, name: '부산호빠 아우라', card: 'busan-hoppa-aura-card', gone: ['인사이더', '사운드 시스템', '분위기 현장'],
    title: '부산호빠 아우라 갈 때 밤늦게 돌아가는 길부터 정해 두기',
    desc: '부산호빠 아우라는 주소와 영업시간을 아직 받지 못한 가게입니다. 확인된 것만 적고, 부산에서 밤늦게 나올 때 도시철도 막차와 택시, 대리운전을 어떻게 미리 정해 두면 좋은지 함께 적었습니다.',
    crumb: '부산호빠 아우라',
    sections: [
      { h: '이 가게에 대해 아는 것', ps: [
        '부산호빠 아우라는 이 사이트의 부산 호빠 목록에 이름이 올라 있다. 주소와 영업시간, 요금, 연락처는 아직 받지 못했다.',
        '실내 묘사와 후기, 영업시간표가 전에 이 자리에 있었지만 출처가 없어 내렸다. 그래서 이 페이지는 가게 소개보다 나오는 길 이야기가 길다.',
      ] },
      { h: '돌아가는 길을 먼저 정하는 까닭', ps: [
        '늦게까지 있을 생각이라면 들어가기 전에 어떻게 돌아갈지 정해 두는 편이 편하다. 자리에서 일어날 때쯤에는 판단이 느려지고, 그때 가서 길을 찾으면 시간이 오래 걸린다.',
        '부산 도시철도 막차는 노선과 요일마다 다르다. 출발하기 전에 내가 탈 노선의 막차 시각을 찾아 휴대폰 메모에 적어 둔다.',
        '막차를 놓칠 것 같으면 택시 앱을 미리 깔아 둔다. 주말 밤에는 차가 바로 안 잡힐 때가 있으니 일어나기 십 분쯤 전에 부른다.',
        '차를 가져갔다면 술을 마신 뒤에는 대리운전을 쓴다. 번호는 미리 저장해 둔다.',
      ] },
      { h: '여럿이 나올 때', ps: [
        '해운대에서 서면처럼 동네를 옮기는 길은 밤에도 시간이 걸린다. 다음 자리를 촘촘하게 잡지 않는다.',
        '일행이 있다면 누가 어느 방향으로 가는지 먼저 묶어 둔다. 같은 방향끼리 택시 한 대를 나눠 타면 기다리는 시간도 차비도 준다.',
        '혼자 돌아간다면 탄 택시의 차량 번호를 가까운 사람에게 보내 둔다. 택시 앱에 가는 길을 남에게 보여 주는 기능이 있으면 그것도 쓴다.',
      ] },
      { h: '차비는 따로 떼어 두기', ps: [
        '마시다 보면 계산이 커지기 쉽다. 쓸 돈과 돌아갈 차비를 지갑 안에서 나눠 두면 마지막에 차비가 모자랄 일이 없다.',
        '카드만 들고 나갔다면 택시 앱에 카드를 미리 등록해 둔다. 현금이 없는 밤에 쓸모가 있다.',
      ] },
      { h: '나서기 전에', ps: [
        '사진이 붙은 신분증과 넉넉히 충전한 휴대폰을 챙긴다. 19세 미만은 들어갈 수 없는 곳이다. 집에 갈 택시비는 따로 떼어 둔다.',
      ] },
    ],
    faqTitle: '부산호빠 아우라에 대해 묻는 것',
    faq: [
      ['부산호빠 아우라 주소를 알 수 있나요?', '가게에서 주소를 보내온 적이 없어 비워 두었습니다. 위치는 가게에 전화해서 물어보는 편이 확실합니다.'],
      ['몇 시까지 하나요?', '영업시간은 가게에서 알려 온 것이 없어 적지 않았습니다. 돌아갈 방법은 가기 전에 따로 정해 두시는 편이 좋습니다.'],
      ['가게 정보를 보내고 싶어요.', '광고문의 카톡 besta12 로 보내 주시면 확인한 뒤 싣습니다.'],
    ],
  },
  {
    slug: 'busan-hoppa-menz', ad: false, name: '부산호빠 맨즈', card: 'busan-hoppa-menz-card', gone: ['인사이더', '사운드 시스템', '분위기 현장'],
    title: '부산호빠 맨즈 여럿이 갈 때 미리 맞출 것',
    desc: '부산호빠 맨즈는 주소와 영업시간을 아직 받지 못한 가게입니다. 확인된 것만 적고, 여럿이 함께 갈 때 인원과 도착 시각, 돈 나누는 방법, 끝낼 시각을 어떻게 미리 맞춰 두면 편한지 적었습니다.',
    crumb: '부산호빠 맨즈',
    sections: [
      { h: '확인된 것은 이름까지', ps: [
        '부산호빠 맨즈는 이 사이트의 부산 호빠 목록에 이름이 올라 있다. 주소와 영업시간, 요금, 연락처는 받은 적이 없다.',
        '전에 적혀 있던 실내 묘사와 후기, 혜택, 영업시간표는 뒷받침할 자료가 없어 비웠다.',
      ] },
      { h: '여럿이 갈 때 맞출 것', ps: [
        '인원이 늘면 정할 것도 는다. 누가 가게에 연락해서 자리를 물을지 한 사람을 정하고, 들은 내용은 단톡방에 그대로 올려 둔다.',
        '모이는 곳과 시각을 정할 때는 가장 멀리서 오는 사람을 기준으로 잡는다. 늦게 합류하는 사람이 있으면 그 사람 이름과 도착 시각도 미리 알려 둔다.',
        '돈은 똑같이 나눌지, 마신 만큼 낼지, 한 사람이 먼저 내고 나중에 보낼지를 출발 전에 정한다. 계산대 앞에서 정하면 말이 길어진다.',
        '끝낼 시각도 함께 정해 둔다. 다음 날 일정이 있는 사람이 먼저 일어나도 서운하지 않게 미리 말해 두는 게 서로 편하다.',
      ] },
      { h: '자리를 물을 때 같이 말할 것', ps: [
        '인원이 많으면 자리가 한 번에 나지 않을 수 있다. 연락할 때 정확한 인원과 도착 시각을 같이 말하고, 몇 명이 나중에 오는지도 알린다.',
        '생일이나 송별회처럼 따로 챙기고 싶은 날이면 그것도 미리 말해 본다. 되는지 안 되는지는 가게마다 달라서 직접 물어봐야 안다.',
      ] },
      { h: '돈 나눌 때 생기는 일', ps: [
        '술을 안 마시는 사람이 있으면 그 사람 몫을 따로 생각한다. 똑같이 나누면 덜 마신 사람이 손해 본다고 느낄 수 있다.',
        '먼저 일어나는 사람이 있으면 그 사람 몫은 그 자리에서 정리한다. 다음 날 단톡방에서 계좌를 묻는 것보다 깔끔하다.',
        '마지막에는 다 같이 나왔는지, 두고 온 물건이 없는지 한 번 둘러본다. 여럿이 움직이면 겉옷이나 휴대폰을 자리에 두고 나오기 쉽다.',
      ] },
      { h: '함께 챙길 것', ps: [
        '19세 미만은 들어갈 수 없어 입구에서 나이를 확인할 때가 있다. 일행 모두 사진이 붙은 신분증을 챙겼는지 출발 전에 한 번 묻는다.',
      ] },
    ],
    faqTitle: '부산호빠 맨즈에 대해 묻는 것',
    faq: [
      ['부산호빠 맨즈에 단체로 가도 되나요?', '단체 손님을 받는지는 확인한 정보가 없습니다. 가게에 직접 물어보세요.'],
      ['요금은 얼마인가요?', '요금표를 받지 못해 적지 않았습니다.'],
      ['가게 정보를 고치려면요?', '카카오톡 besta12(광고문의)로 알려 주시면 확인하고 고쳐 둡니다.'],
    ],
  },
  {
    slug: 'busan-hoppa-ggantappiya', ad: false, name: '부산호빠 깐따삐야', card: 'busan-hoppa-ggantappiya-card', gone: ['인사이더', '사운드 시스템', '분위기 현장'],
    title: '부산호빠 깐따삐야 가기 전 가방에 넣을 것',
    desc: '부산호빠 깐따삐야는 아직 주소와 영업시간이 들어오지 않은 가게입니다. 확인된 것만 적고, 처음 가는 날 가방에 넣을 신분증과 결제 수단, 휴대폰 배터리, 겉옷처럼 미리 챙기면 덜 헤매는 것을 적었습니다.',
    crumb: '부산호빠 깐따삐야',
    sections: [
      { h: '이 페이지가 아는 것', ps: [
        '부산호빠 깐따삐야는 이 사이트의 부산 호빠 목록에 이름만 올라 있는 가게다. 주소도 영업시간도 요금도 연락처도 가게에서 아직 알려 오지 않았다.',
        '이 자리에 있던 실내 묘사와 후기, 영업시간표는 가게가 알려 준 것이 아니라서 지웠다. 모르는 것은 비워 두고 가방에 챙길 것만 적는다.',
      ] },
      { h: '가방에 넣을 것', ps: [
        '사진이 붙은 신분증이 먼저다. 주민등록증이나 운전면허증이면 된다. 19세 미만은 못 들어가는 곳이라 입구에서 신분증을 보자고 할 수 있다.',
        '결제 수단은 가게마다 다르다. 카드 한 장과 약간의 현금을 같이 챙기면 어느 쪽이든 대응할 수 있다. 밤늦게는 은행 자동화기기 코너가 닫혀 있을 때가 있어 현금은 미리 찾아 둔다.',
        '휴대폰은 꽉 채워 나간다. 지도와 택시 앱을 오래 켜 두면 배터리가 금방 준다. 보조 배터리가 있으면 같이 넣는다.',
        '겉옷을 맡길 곳이 있는지 모르니 가볍게 입는다. 귀중품은 꼭 필요한 것만 들고 간다.',
      ] },
      { h: '집에 두고 가도 되는 것', ps: [
        '큰 가방은 들고 다니기 번거롭다. 신분증과 카드, 휴대폰, 열쇠 정도만 작은 가방에 넣으면 자리에서도 챙기기 쉽다.',
        '평소에 안 쓰는 카드나 많은 현금은 집에 둔다. 잃어버렸을 때 신경 쓸 것이 줄어든다.',
      ] },
      { h: '돌아와서 확인할 것', ps: [
        '집에 오면 카드 결제 문자를 한 번 훑어본다. 금액이 들은 것과 다르면 다음 날이라도 가게에 물어보면 된다. 영수증은 그때까지 버리지 않는다.',
        '휴대폰과 지갑, 신분증이 다 있는지 현관에서 확인한다. 밤늦게 잃어버린 걸 알면 찾기가 더 어렵다.',
      ] },
      { h: '나서기 직전에', ps: [
        '도착했다는 소식과 돌아갈 시각을 가까운 사람에게 한 줄 남겨 두면 마음이 놓인다. 술을 마실 날은 차를 두고 나선다.',
      ] },
    ],
    faqTitle: '부산호빠 깐따삐야에 대해 묻는 것',
    faq: [
      ['부산호빠 깐따삐야는 어디에 있나요?', '아직 주소가 들어오지 않아 적지 못했습니다. 가게에 직접 확인해 주세요.'],
      ['카드 결제가 되나요?', '결제 수단은 확인한 정보가 없습니다. 카드와 현금을 같이 챙기시면 편합니다.'],
      ['가게 정보를 보내려면요?', '카톡 besta12(광고문의)로 보내 주세요. 확인되는 대로 이 페이지에 올립니다.'],
    ],
  },
];

const A = '(?: data-astro-cid-[a-z0-9]+)*';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const visibleOf = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
const altOf = (p) => (p.ad ? `${p.name} ${NICK} 안내 카드` : `${p.name} 광고문의 안내 카드`);
function ident(h) {
  const g = (re) => { const m = h.match(re); return m ? m[1] : null; };
  return { canonical: g(/<link rel="canonical" href="([^"]*)"/), ogurl: g(/<meta property="og:url" content="([^"]*)"/) };
}
function cardOf(prefix) {
  const ogDir = join(ROOT, 'og');
  if (!existsSync(ogDir)) stop(`카드 폴더가 없음: ${ogDir}`);
  const re = new RegExp(`^${esc(prefix)}-[0-9a-f]{8}\\.png$`);
  const cards = readdirSync(ogDir).filter((f) => re.test(f));
  if (cards.length !== 1) stop(`카드(${prefix}-<8자리>.png)가 1개여야 하는데 ${cards.length}개`);
  return cards[0];
}
function mainHtml(p, cardPath) {
  const secs = p.sections.map((s) => `<h2 class="tp-title" ${CID}>${s.h}</h2> ` + s.ps.map((t) => `<p class="tp-desc" ${CID}>${t}</p>`).join('') + (s.call ? CALL : '')).join(' ');
  const faq = `<h2 class="tp-title" ${CID}>${p.faqTitle}</h2> ` + p.faq.map(([q, a]) => `<div class="faq-item" ${CID}> <div class="faq-q" ${CID}>${q}</div> <div class="faq-a" ${CID}>${a}</div> </div>`).join('');
  const tail = p.ad ? `<p class="ad-notice" style="margin:24px 0 8px;padding:12px 16px;font-size:13px;line-height:1.6;color:var(--text-secondary);text-align:center;border-top:1px solid var(--border);">${NOTICE}</p>` : `${HUB}${INQ}`;
  return `   <section class="vh" style="background:linear-gradient(135deg,#E11D48,#FB7185)" ${CID}> <nav class="bc" ${CID}> <a href="/" ${CID}>홈</a><span ${CID}>›</span> <a href="/hoppa/" ${CID}>호빠</a><span ${CID}>›</span> <span class="bc-cur" ${CID}>${p.crumb}</span> </nav> <div class="vh-badge" ${CID}>호빠</div> ${AGE(p.ad)}<h1 ${CID}>${p.name}</h1>   <img src="${cardPath}" alt="${attr(altOf(p))}" width="1200" height="1200" fetchpriority="high" class="vh-img" style="aspect-ratio:1/1;height:auto;" ${CID}> </section> <div class="tab-panel active" id="tab-info" ${CID}> ${secs} ${faq} </div> ${MARK}${tail}`;
}
function ldOf(p, url, cardUrl) {
  const club = { '@context': 'https://schema.org', '@type': 'NightClub', name: p.name, image: { '@type': 'ImageObject', url: cardUrl, width: 1200, height: 1200, caption: altOf(p) }, url };
  if (p.ad) { club.description = `건대 쪽 호스트바. 예약은 담당 ${NICK}이 전화로 받는다. 주소와 영업시간은 받은 정보가 없다.`; club.telephone = LD_TEL; }
  else { club.description = '이 사이트 부산 호빠 목록에 이름이 오른 가게. 주소·영업시간·요금은 확인하지 못했다.'; club.address = { '@type': 'PostalAddress', addressRegion: '부산', addressCountry: 'KR' }; }
  return [null, null, club,
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: HOST },
      { '@type': 'ListItem', position: 2, name: '호빠', item: `${HOST}/hoppa/` },
      { '@type': 'ListItem', position: 3, name: p.crumb, item: url },
    ] }];
}
const BANNERS = [`<div class="slide-up-banner"${A} id="slideUpBanner"${A}>`, `<div class="scroll-banner"${A} id="scrollBanner"${A}>`];
const BANNER_WORDS = ['더 많은 정보가 기다리고 있습니다', '여기서 끝이 아닙니다'];
function verify(h, p, cardPath, cardUrl) {
  const bad = [];
  const has = (s, label) => { if (!h.includes(s)) bad.push(label); };
  has(`<title>${p.title}</title>`, '제목');
  has(`<meta name="description" content="${attr(p.desc)}">`, '설명');
  has(`<meta property="og:image" content="${cardUrl}">`, 'og:image');
  has(`<meta name="twitter:image" content="${cardUrl}">`, 'twitter:image');
  has('<meta name="robots" content="index, follow, max-image-preview:large">', 'robots 메타(max-image-preview:large)');
  has(`<img src="${cardPath}" alt="${attr(altOf(p))}" width="1200" height="1200"`, '본문 카드 img');
  if ((h.match(/<h1\b/g) || []).length !== 1) bad.push('h1 하나 아님');
  if ((h.match(/<img\b/g) || []).length !== 1) bad.push('그림이 카드 한 장이 아님');
  if (/id="(toast|varReward|fomoCounter|slideUpBanner|scrollBanner)"/.test(h)) bad.push('지어낸 알림·광고 창 남음');
  const seen = h.replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, ' ');
  for (const w of [...p.gone, ...BANNER_WORDS]) if (seen.includes(w)) bad.push(`옛 글 「${w}」 남음`);
  const vis = visibleOf(h);
  const n = vis.split(PHONE).length - 1;
  if (p.ad) {
    has(`href="${TEL}" class="phone-bar has-phone"`, '전화바 tel');
    has(`"telephone":"${LD_TEL}"`, 'JSON-LD telephone');
    has(NOTICE, '관계 고지');
    if (n < 2 || n > 3) bad.push(`보이는 번호 ${n}번`);
  } else {
    if (/01[016789][-. ]?\d{3,4}[-. ]?\d{4}/.test(vis) || h.includes('"telephone"')) bad.push('광고문의 쪽에 번호');
  }
  if (/01[016789][-. ]?\d{3,4}[-. ]?\d{4}|광고문의|카톡|besta12/.test(p.title + p.name)) bad.push('제목·h1 에 연락처');
  if ([...p.title].length > 60) bad.push('제목 60자 넘음');
  return bad;
}
function removeEl(h, re, missing, label, need) {
  const all = [...h.matchAll(new RegExp(re, 'g'))];
  if (all.length !== 1) { if (need) missing.push(`${label}(찾은 수 ${all.length})`); return h; }
  const start = all[0].index;
  const tag = h.slice(start).match(/^<([a-zA-Z][a-zA-Z0-9]*)\b/)[1].toLowerCase();
  const tr = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi'); tr.lastIndex = start;
  let depth = 0, end = -1, m;
  while ((m = tr.exec(h))) { if (m[1] === '/') { depth--; if (depth === 0) { end = m.index + m[0].length; break; } } else if (!m[0].endsWith('/>')) depth++; }
  if (end < 0) { missing.push(`${label}(닫는 태그)`); return h; }
  return h.slice(0, start) + h.slice(end);
}

const outs = [];
let already = 0;
const pairs = []; // 사이트맵 <image:image> 에 넣을 (쪽 주소 · 그 쪽 안내 카드 주소) — 다섯 쪽 + 큐브
for (const p of PAGES) {
  const file = join(ROOT, 'venue', p.slug, 'index.html');
  if (!existsSync(file)) stop(`쪽 파일 없음: ${file}`);
  const url = `${HOST}/venue/${p.slug}/`;
  const card = cardOf(p.card);
  const cardPath = `/og/${card}`;
  const cardUrl = `${HOST}${cardPath}`;
  pairs.push({ url, cardUrl });
  const before = readFileSync(file, 'utf8');
  const id0 = ident(before);
  if (id0.canonical !== url || id0.ogurl !== url) stop(`${p.slug} canonical·og:url 다름: ${id0.canonical} · ${id0.ogurl}`);
  if (before.includes(MARK)) { const bad = verify(before, p, cardPath, cardUrl); if (bad.length) stop(`${p.slug} 표식은 있는데 빠짐: ${bad.join(' · ')}`); already++; continue; }
  let h = before;
  const missing = [];
  const once = (label, re, repl) => {
    const n = (h.match(new RegExp(re.source, 'g')) || []).length;
    if (n !== 1) { missing.push(`${label}(찾은 수 ${n})`); return; }
    h = h.replace(re, typeof repl === 'string' ? () => repl : repl);
  };
  const alt = altOf(p);
  once('title', /<title>[^<]*<\/title>/, `<title>${p.title}</title>`);
  once('description', /<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(p.desc)}">`);
  once('og:title', /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(p.title)}">`);
  once('og:description', /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(p.desc)}">`);
  once('og:image', /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${cardUrl}">`);
  once('og:image:width', /<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1200">');
  once('og:image:height', /<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="1200">');
  once('og:image:alt', /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${attr(alt)}">`);
  once('twitter:card', /<meta name="twitter:card" content="[^"]*">/, '<meta name="twitter:card" content="summary_large_image">');
  once('twitter:title', /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${attr(p.title)}">`);
  once('twitter:description', /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${attr(p.desc)}">`);
  once('twitter:image', /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${cardUrl}">`);
  once('robots 메타', /<meta name="robots" content="index, follow">/, '<meta name="robots" content="index, follow, max-image-preview:large">'); // 구글 robots meta max-image-preview:large — 안내 카드 미리보기 크게(구글69-1 2-3 · 틀은 안 건드리고 이 쪽만)
  if (p.ad) once('머리 끝', /<\/head>/, `${BAR_PC_STYLE}</head>`);
  {
    const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (lds.length !== 1) missing.push(`JSON-LD 덩이(${lds.length})`);
    else {
      let data = null; try { data = JSON.parse(lds[0][1]); } catch { missing.push('JSON-LD 읽기'); }
      if (data) {
        const types = (Array.isArray(data) ? data : [data]).map((n) => n && n['@type']).join(',');
        if (types !== 'Organization,WebSite,NightClub,FAQPage,BreadcrumbList') missing.push(`JSON-LD 짜임(${types})`);
        else {
          const nu = ldOf(p, url, cardUrl); nu[0] = data[0]; nu[1] = data[1];
          h = h.slice(0, lds[0].index) + `<script type="application/ld+json">${JSON.stringify(nu).replace(/<\//g, '<\\/')}</script>` + h.slice(lds[0].index + lds[0][0].length);
        }
      }
    }
  }
  {
    const ms = [...h.matchAll(/<main data-astro-cid-37fxchfa>/g)];
    const ends = [...h.matchAll(/<\/main>/g)];
    if (ms.length !== 1 || ends.length !== 1) missing.push(`main(${ms.length}·${ends.length})`);
    else {
      const a = ms[0].index + ms[0][0].length; const b = ends[0].index;
      if (!h.slice(a, b).includes('<section class="vh"')) missing.push('main 안 히어로');
      else h = h.slice(0, a) + mainHtml(p, cardPath) + h.slice(b);
    }
  }
  if (p.ad) once('아래 고정 바', new RegExp(`<a href="https://nolcool\\.com" target="_blank" rel="noopener noreferrer" class="phone-bar no-phone"(${A})>[^<]*</a>`),
    (_m, cid) => `<a href="${TEL}" class="phone-bar has-phone" style="font-size:clamp(13px,3.9vw,18px);letter-spacing:0;white-space:nowrap;"${cid}>${p.name} 예약 · ${NICK} ${PHONE}</a>`);
  h = removeEl(h, `<span style="margin-left:12px;color:var\\(--accent\\);font-weight:600;"${A} id="fomoCounter"${A}>`, missing, '지금 N명', false);
  h = removeEl(h, `<div class="toast"${A} id="toast"${A}>`, missing, '토스트', false); // 공통 틀에서 뺐다(2026-11-13) — 없으면 넘어감
  h = removeEl(h, `<div class="var-reward"${A} id="varReward"${A}>`, missing, '떠오르는 알림', true);
  for (const b of BANNERS) h = removeEl(h, b, missing, '광고 안내 창', true);
  if (missing.length) stop(`${p.slug} 못 찾은 자리 — ${missing.join(' · ')} (아무 쪽도 쓰지 않음)`);
  const id1 = ident(h);
  for (const k of Object.keys(id0)) if (id0[k] !== id1[k]) stop(`${p.slug} ${k} 바뀜`);
  const bad = verify(h, p, cardPath, cardUrl);
  if (bad.length) stop(`${p.slug} 넣은 뒤 확인 빠짐: ${bad.join(' · ')}`);
  outs.push({ file, h, before, card, p });
}
/* 큐브 쪽 — 광고 안내 창 둘만 뺀다(글·카드는 ad-set-cube 몫) */
const cubeFile = join(ROOT, 'venue', 'jangandong-hoppa-cube', 'index.html');
if (!existsSync(cubeFile)) stop('큐브 쪽 파일 없음');
let cube = readFileSync(cubeFile, 'utf8');
const cubeBefore = cube;
{
  const missing = [];
  for (const b of BANNERS) cube = removeEl(cube, b, missing, '큐브 광고 안내 창', false);
  if (missing.length) stop(`큐브 — ${missing.join(' · ')}`);
  if (BANNER_WORDS.some((w) => cube.includes(w))) stop('큐브 쪽에 광고 안내 문구 남음');
  if (JSON.stringify(ident(cube)) !== JSON.stringify(ident(cubeBefore))) stop('큐브 canonical 바뀜');
}
/* 사이트맵 <image:image> — 여섯 쪽(다섯 + 큐브)의 <url> 에 그 쪽에 실제로 보이는 안내 카드 하나(구글69-1 2-3).
   구글 이미지 사이트맵 공식(developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps · 확인 2026-11-08): <image:image><image:loc> 만 · caption·title·geo_location·license 는 폐기.
   generate-sitemap.mjs(빌드 앞 단계) 가 만든 dist/sitemap.xml 에 이름 공간과 여섯 덩이만 더한다 · 다시 돌리면 확인만(멱등) · 자리를 못 찾으면 아무것도 쓰지 않고 종료 1 */
function sitemapWithImages(list) {
  const file = join(ROOT, 'sitemap.xml');
  if (!existsSync(file)) stop(`사이트맵 없음: ${file}`);
  let x = readFileSync(file, 'utf8');
  if (!x.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
    const n = (x.match(/<urlset\b[^>]*>/g) || []).length;
    if (n !== 1) stop(`사이트맵 urlset(찾은 수 ${n})`);
    x = x.replace(/<urlset\b([^>]*)>/, (_m, a) => `<urlset${a} xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`);
  }
  let added = 0;
  for (const { url, cardUrl } of list) {
    const all = [...x.matchAll(new RegExp(`<url>\\s*<loc>${esc(url)}</loc>[\\s\\S]*?</url>`, 'g'))];
    if (all.length !== 1) stop(`사이트맵 <url> ${url}(찾은 수 ${all.length})`);
    const block = all[0][0];
    if (block.includes('<image:image>')) { if (!block.includes(`<image:loc>${cardUrl}</image:loc>`)) stop(`사이트맵 ${url} 의 image:loc 이 이 쪽 카드와 다름`); continue; }
    const nu = block.replace(/<\/url>$/, () => `<image:image><image:loc>${cardUrl}</image:loc></image:image></url>`);
    x = x.slice(0, all[0].index) + nu + x.slice(all[0].index + block.length); added++;
  }
  return { text: x, added };
}
{
  const cubeOg = (cube.match(/<meta property="og:image" content="([^"]*)">/) || [])[1];
  if (!cubeOg) stop('큐브 og:image 없음');
  pairs.push({ url: `${HOST}/venue/jangandong-hoppa-cube/`, cardUrl: cubeOg });
}
const smap = sitemapWithImages(pairs); // 쓰기 전에 전부 확인(자리를 못 찾으면 여기서 종료 1 · 쪽도 쓰지 않음)
for (const o of outs) writeFileSync(o.file, o.h);
for (const o of outs) console.log(`${TAG} 넣음 — ${o.p.slug} · 카드 ${o.card} · ${o.before.length}B → ${o.h.length}B`);
if (cube !== cubeBefore) { writeFileSync(cubeFile, cube); console.log(`${TAG} 큐브 쪽 광고 안내 창 뺌 · ${cubeBefore.length}B → ${cube.length}B`); } else console.log(`${TAG} 큐브 쪽 광고 안내 창 이미 없음`);
if (smap.added) writeFileSync(join(ROOT, 'sitemap.xml'), smap.text);
console.log(`${TAG} 사이트맵 image:image — 더함 ${smap.added} · 이미 있음 ${pairs.length - smap.added}`);
if (already) console.log(`${TAG} 이미 넣음 ${already}쪽`);
