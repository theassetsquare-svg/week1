const menus = {
  korean: [
    { name: "김치찌개", emoji: "🍲" },
    { name: "된장찌개", emoji: "🥘" },
    { name: "불고기", emoji: "🥩" },
    { name: "비빔밥", emoji: "🍚" },
    { name: "삼겹살", emoji: "🥓" },
    { name: "제육볶음", emoji: "🍖" },
    { name: "갈비찜", emoji: "🍗" },
    { name: "순두부찌개", emoji: "🫕" },
    { name: "닭갈비", emoji: "🐔" },
    { name: "감자탕", emoji: "🦴" },
  ],
  chinese: [
    { name: "짜장면", emoji: "🍜" },
    { name: "짬뽕", emoji: "🌶️" },
    { name: "탕수육", emoji: "🍖" },
    { name: "마라탕", emoji: "🔥" },
    { name: "볶음밥", emoji: "🍳" },
    { name: "양장피", emoji: "🥗" },
    { name: "마파두부", emoji: "🧈" },
  ],
  japanese: [
    { name: "초밥", emoji: "🍣" },
    { name: "라멘", emoji: "🍜" },
    { name: "돈카츠", emoji: "🐷" },
    { name: "우동", emoji: "🍲" },
    { name: "카레", emoji: "🍛" },
    { name: "규동", emoji: "🥩" },
    { name: "오코노미야끼", emoji: "🥞" },
  ],
  western: [
    { name: "파스타", emoji: "🍝" },
    { name: "피자", emoji: "🍕" },
    { name: "스테이크", emoji: "🥩" },
    { name: "햄버거", emoji: "🍔" },
    { name: "리조또", emoji: "🍚" },
    { name: "샐러드", emoji: "🥗" },
    { name: "감바스", emoji: "🦐" },
  ],
  snack: [
    { name: "떡볶이", emoji: "🌶️" },
    { name: "김밥", emoji: "🍙" },
    { name: "라면", emoji: "🍜" },
    { name: "순대", emoji: "🫕" },
    { name: "튀김", emoji: "🍤" },
    { name: "치킨", emoji: "🍗" },
    { name: "족발", emoji: "🐷" },
  ],
};

let currentCategory = "all";
const history = [];

function getAllMenus() {
  return Object.values(menus).flat();
}

function getMenusByCategory(category) {
  if (category === "all") return getAllMenus();
  return menus[category] || [];
}

function getRandomMenu() {
  const list = getMenusByCategory(currentCategory);
  return list[Math.floor(Math.random() * list.length)];
}

const btn = document.getElementById("recommend-btn");
const resultDiv = document.getElementById("result");
const emojiSpan = document.getElementById("emoji");
const menuSpan = document.getElementById("menu");
const historyList = document.getElementById("history-list");

btn.addEventListener("click", () => {
  btn.classList.add("spin");
  setTimeout(() => btn.classList.remove("spin"), 400);

  const pick = getRandomMenu();
  emojiSpan.textContent = pick.emoji;
  menuSpan.textContent = pick.name;
  resultDiv.classList.remove("hidden");

  history.unshift(pick.name);
  if (history.length > 10) history.pop();
  renderHistory();
});

function renderHistory() {
  historyList.innerHTML = history
    .map((item) => `<li>${item}</li>`)
    .join("");
}

document.querySelectorAll(".filter-btn").forEach((filterBtn) => {
  filterBtn.addEventListener("click", () => {
    document.querySelector(".filter-btn.active").classList.remove("active");
    filterBtn.classList.add("active");
    currentCategory = filterBtn.dataset.category;
  });
});
