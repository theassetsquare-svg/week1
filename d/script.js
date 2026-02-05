const quotes = [
  "음악과 조명은 과하지 않게 균형을 맞추는 것이 기본입니다.",
  "여유 있는 흐름이 있을 때 공간의 분위기가 더 잘 전달됩니다.",
  "편안한 동선이 만족도를 높이는 핵심 요소입니다."
];
let idx = 0;
const card = document.getElementById("quote-card");
const prev = document.getElementById("prev");
const next = document.getElementById("next");

function render() { card.textContent = quotes[idx]; }
prev.addEventListener("click", () => { idx = (idx - 1 + quotes.length) % quotes.length; render(); });
next.addEventListener("click", () => { idx = (idx + 1) % quotes.length; render(); });
render();

const menuToggle = document.querySelector(".menu-toggle");
const topbarLinks = document.querySelector(".topbar-links");
if (menuToggle && topbarLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbarLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}
