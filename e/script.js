const notes = {
  m1: "준비 단계: 여유 있는 시작이 가장 중요합니다.",
  m2: "첫 인상: 리듬을 천천히 확인하세요.",
  m3: "메인 흐름: 동선을 따라 자연스럽게 이동합니다.",
  m4: "마무리: 라운지에서 편안하게 정리합니다."
};
const noteCard = document.getElementById("note-card");
const targets = document.querySelectorAll(".moment");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        noteCard.textContent = notes[entry.target.classList[1]] || noteCard.textContent;
      }
    });
  },
  { threshold: 0.5 }
);

targets.forEach((el) => observer.observe(el));

const menuToggle = document.querySelector(".menu-toggle");
const topbarLinks = document.querySelector(".topbar-links");
if (menuToggle && topbarLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbarLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}
