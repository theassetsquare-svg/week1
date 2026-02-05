const moodData = {
  quiet: "조용한 분위기는 여유 있는 동선을 추천합니다.",
  balanced: "균형 있는 분위기는 메인 흐름과 라운지 이동을 권장합니다.",
  tempo: "템포 중심이라면 리듬 변화가 큰 시간대를 참고하세요."
};
const buttons = document.querySelectorAll(".mood-buttons button");
const copy = document.getElementById("mood-copy");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    copy.textContent = moodData[btn.dataset.mood];
  });
});
