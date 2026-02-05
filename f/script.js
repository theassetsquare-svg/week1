const plannerResult = document.getElementById("planner-result");
const plannerChecks = document.querySelectorAll(".planner-options input");

function updatePlanner() {
  const selected = Array.from(plannerChecks)
    .filter((item) => item.checked)
    .map((item) => item.value);

  if (selected.length === 0) {
    plannerResult.textContent = "선택 항목을 체크하면 맞춤 안내가 표시됩니다.";
    return;
  }

  const hints = [];
  if (selected.includes("first")) hints.push("처음 방문이라면 라운지에서 적응하는 시간을 두세요.");
  if (selected.includes("friends")) hints.push("친구 모임은 대화 가능한 구역에서 시작하는 것이 좋습니다.");
  if (selected.includes("calm")) hints.push("편안한 분위기 선호 시 여유 있는 시간대를 추천합니다.");
  if (selected.includes("photo")) hints.push("기록은 주변 분위기를 배려하며 진행하세요.");

  plannerResult.textContent = hints.join(" ");
}

plannerChecks.forEach((item) => item.addEventListener("change", updatePlanner));

const menuToggle = document.querySelector(".menu-toggle");
const topbarLinks = document.querySelector(".topbar-links");
if (menuToggle && topbarLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbarLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}
