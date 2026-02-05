const notes = {
  t1: "입장 전 단계: 여유 있는 준비가 가장 중요합니다.",
  t2: "첫 리듬 단계: 흐름을 천천히 파악하세요.",
  t3: "중심 흐름 단계: 메인 동선에서 리듬을 즐깁니다.",
  t4: "정리 단계: 라운지에서 편안하게 마무리합니다."
};
const noteCard = document.getElementById("note-card");
const targets = document.querySelectorAll(".panel");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        noteCard.textContent = notes[entry.target.id] || noteCard.textContent;
      }
    });
  },
  { threshold: 0.5 }
);

targets.forEach((el) => observer.observe(el));
