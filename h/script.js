const menuToggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.topbar-links');
if (menuToggle && links) {
  menuToggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

const toggle = document.getElementById('toggle');
const compareBody = document.getElementById('compare-body');
if (toggle && compareBody) {
  let expanded = false;
  toggle.addEventListener('click', () => {
    expanded = !expanded;
    toggle.textContent = expanded ? '요약 보기' : '상세 보기';
    compareBody.innerHTML = expanded
      ? '<p><strong>상세:</strong> 조명은 눈의 피로를 줄이는 톤을 기준으로 안내하며, 음악은 강약의 변화가 급하지 않도록 설명합니다. 동선은 입장 구역에서 메인 구역, 휴식 구역으로 이어지며, 각 구역의 역할을 이해하면 이동이 훨씬 편해집니다. 대화 중심 구역과 리듬 중심 구역을 구분해 선택하면 자신의 취향을 유지하기 쉽습니다.</p>'
      : '<p><strong>요약:</strong> 공간은 균형감 중심, 동선은 자연스러운 흐름, 음악은 완만한 템포 변화를 기준으로 안내합니다.</p>';
  });
}
