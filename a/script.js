const moodData = {
  calm: "차분한 분위기를 선호한다면 여유 있는 시간대를 추천합니다.",
  bright: "밝은 분위기를 원한다면 입장 초반에 공간을 넓게 둘러보세요.",
  rhythm: "리듬 중심의 분위기를 원한다면 음악 흐름에 천천히 맞춰보세요."
};

const buttons = document.querySelectorAll(".mood-buttons button");
const text = document.getElementById("mood-text");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    buttons.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    text.textContent = moodData[btn.dataset.mood];
  });
});

const menuToggle = document.querySelector(".menu-toggle");
const topbarLinks = document.querySelector(".topbar-links");
if (menuToggle && topbarLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbarLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}
