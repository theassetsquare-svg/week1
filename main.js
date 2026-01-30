const menus = {
  korean: [
    { name: "김치찌개", emoji: "🍲", img: "https://source.unsplash.com/400x300/?kimchi-jjigae,kimchi-stew" },
    { name: "된장찌개", emoji: "🥘", img: "https://source.unsplash.com/400x300/?doenjang-jjigae,soybean-stew" },
    { name: "불고기", emoji: "🥩", img: "https://source.unsplash.com/400x300/?bulgogi" },
    { name: "비빔밥", emoji: "🍚", img: "https://source.unsplash.com/400x300/?bibimbap" },
    { name: "삼겹살", emoji: "🥓", img: "https://source.unsplash.com/400x300/?samgyeopsal,korean-pork-belly" },
    { name: "제육볶음", emoji: "🍖", img: "https://source.unsplash.com/400x300/?korean-spicy-pork" },
    { name: "갈비찜", emoji: "🍗", img: "https://source.unsplash.com/400x300/?galbijjim,braised-ribs" },
    { name: "순두부찌개", emoji: "🫕", img: "https://source.unsplash.com/400x300/?sundubu,tofu-stew" },
    { name: "닭갈비", emoji: "🐔", img: "https://source.unsplash.com/400x300/?dakgalbi,korean-chicken" },
    { name: "감자탕", emoji: "🦴", img: "https://source.unsplash.com/400x300/?gamjatang,pork-bone-soup" },
  ],
  chinese: [
    { name: "짜장면", emoji: "🍜", img: "https://source.unsplash.com/400x300/?jajangmyeon,black-bean-noodles" },
    { name: "짬뽕", emoji: "🌶️", img: "https://source.unsplash.com/400x300/?jjamppong,spicy-seafood-noodles" },
    { name: "탕수육", emoji: "🍖", img: "https://source.unsplash.com/400x300/?sweet-sour-pork" },
    { name: "마라탕", emoji: "🔥", img: "https://source.unsplash.com/400x300/?malatang,hot-pot" },
    { name: "볶음밥", emoji: "🍳", img: "https://source.unsplash.com/400x300/?fried-rice" },
    { name: "양장피", emoji: "🥗", img: "https://source.unsplash.com/400x300/?chinese-cold-plate" },
    { name: "마파두부", emoji: "🧈", img: "https://source.unsplash.com/400x300/?mapo-tofu" },
  ],
  japanese: [
    { name: "초밥", emoji: "🍣", img: "https://source.unsplash.com/400x300/?sushi" },
    { name: "라멘", emoji: "🍜", img: "https://source.unsplash.com/400x300/?ramen" },
    { name: "돈카츠", emoji: "🐷", img: "https://source.unsplash.com/400x300/?tonkatsu,pork-cutlet" },
    { name: "우동", emoji: "🍲", img: "https://source.unsplash.com/400x300/?udon" },
    { name: "카레", emoji: "🍛", img: "https://source.unsplash.com/400x300/?japanese-curry" },
    { name: "규동", emoji: "🥩", img: "https://source.unsplash.com/400x300/?gyudon,beef-bowl" },
    { name: "오코노미야끼", emoji: "🥞", img: "https://source.unsplash.com/400x300/?okonomiyaki" },
  ],
  western: [
    { name: "파스타", emoji: "🍝", img: "https://source.unsplash.com/400x300/?pasta" },
    { name: "피자", emoji: "🍕", img: "https://source.unsplash.com/400x300/?pizza" },
    { name: "스테이크", emoji: "🥩", img: "https://source.unsplash.com/400x300/?steak" },
    { name: "햄버거", emoji: "🍔", img: "https://source.unsplash.com/400x300/?hamburger" },
    { name: "리조또", emoji: "🍚", img: "https://source.unsplash.com/400x300/?risotto" },
    { name: "샐러드", emoji: "🥗", img: "https://source.unsplash.com/400x300/?salad" },
    { name: "감바스", emoji: "🦐", img: "https://source.unsplash.com/400x300/?gambas,garlic-shrimp" },
  ],
  snack: [
    { name: "떡볶이", emoji: "🌶️", img: "https://source.unsplash.com/400x300/?tteokbokki" },
    { name: "김밥", emoji: "🍙", img: "https://source.unsplash.com/400x300/?gimbap,kimbap" },
    { name: "라면", emoji: "🍜", img: "https://source.unsplash.com/400x300/?korean-ramyeon,instant-noodles" },
    { name: "순대", emoji: "🫕", img: "https://source.unsplash.com/400x300/?korean-sundae,blood-sausage" },
    { name: "튀김", emoji: "🍤", img: "https://source.unsplash.com/400x300/?korean-tempura,fried-food" },
    { name: "치킨", emoji: "🍗", img: "https://source.unsplash.com/400x300/?korean-fried-chicken" },
    { name: "족발", emoji: "🐷", img: "https://source.unsplash.com/400x300/?jokbal,braised-pork" },
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
const menuImg = document.getElementById("menu-img");
const historyList = document.getElementById("history-list");

btn.addEventListener("click", () => {
  btn.classList.add("spin");
  setTimeout(() => btn.classList.remove("spin"), 400);

  const pick = getRandomMenu();
  emojiSpan.textContent = pick.emoji;
  menuSpan.textContent = pick.name;
  menuImg.src = pick.img;
  menuImg.alt = pick.name;
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
