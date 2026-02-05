const toggle = document.getElementById("toggle");
const body = document.getElementById("compare-body");
let expanded = false;

toggle.addEventListener("click", () => {
  expanded = !expanded;
  toggle.textContent = expanded ? "요약 보기" : "상세 보기";
  body.innerHTML = expanded
    ? "<p>상세: 방문 목적에 따라 동선을 선택하는 것이 핵심입니다. 친구 모임은 대화 중심, 처음 방문은 공간 적응 중심, 조용한 분위기 선호는 여유 시간대 선택이 좋습니다.</p>"
    : "<p>요약: 수원찬스돔나이트는 상황에 맞춰 흐름을 선택하는 안내를 제공합니다.</p>";
});
