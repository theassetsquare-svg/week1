const menus = {
  korean: [
    { name: "김치찌개", emoji: "🍲", img: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop" },
    { name: "된장찌개", emoji: "🥘", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop" },
    { name: "불고기", emoji: "🥩", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop" },
    { name: "비빔밥", emoji: "🍚", img: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400&h=300&fit=crop" },
    { name: "삼겹살", emoji: "🥓", img: "https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?w=400&h=300&fit=crop" },
    { name: "제육볶음", emoji: "🍖", img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop" },
    { name: "갈비찜", emoji: "🍗", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop" },
    { name: "순두부찌개", emoji: "🫕", img: "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=400&h=300&fit=crop" },
    { name: "닭갈비", emoji: "🐔", img: "https://images.unsplash.com/photo-1632558610168-5aa0e9a3a4e1?w=400&h=300&fit=crop" },
    { name: "감자탕", emoji: "🦴", img: "https://images.unsplash.com/photo-1583224964978-2257b960c3f3?w=400&h=300&fit=crop" },
  ],
  chinese: [
    { name: "짜장면", emoji: "🍜", img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop" },
    { name: "짬뽕", emoji: "🌶️", img: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop" },
    { name: "탕수육", emoji: "🍖", img: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop" },
    { name: "마라탕", emoji: "🔥", img: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop" },
    { name: "볶음밥", emoji: "🍳", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop" },
    { name: "양장피", emoji: "🥗", img: "https://images.unsplash.com/photo-1541696490-8744a5dc0228?w=400&h=300&fit=crop" },
    { name: "마파두부", emoji: "🧈", img: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop" },
  ],
  japanese: [
    { name: "초밥", emoji: "🍣", img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop" },
    { name: "라멘", emoji: "🍜", img: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=300&fit=crop" },
    { name: "돈카츠", emoji: "🐷", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop" },
    { name: "우동", emoji: "🍲", img: "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=400&h=300&fit=crop" },
    { name: "카레", emoji: "🍛", img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop" },
    { name: "규동", emoji: "🥩", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop" },
    { name: "오코노미야끼", emoji: "🥞", img: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop" },
  ],
  western: [
    { name: "파스타", emoji: "🍝", img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop" },
    { name: "피자", emoji: "🍕", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop" },
    { name: "스테이크", emoji: "🥩", img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop" },
    { name: "햄버거", emoji: "🍔", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop" },
    { name: "리조또", emoji: "🍚", img: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop" },
    { name: "샐러드", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" },
    { name: "감바스", emoji: "🦐", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop" },
  ],
  snack: [
    { name: "떡볶이", emoji: "🌶️", img: "https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400&h=300&fit=crop" },
    { name: "김밥", emoji: "🍙", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop" },
    { name: "라면", emoji: "🍜", img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop" },
    { name: "순대", emoji: "🫕", img: "https://images.unsplash.com/photo-1583224964978-2257b960c3f3?w=400&h=300&fit=crop" },
    { name: "튀김", emoji: "🍤", img: "https://images.unsplash.com/photo-1581184953963-d15972933db1?w=400&h=300&fit=crop" },
    { name: "치킨", emoji: "🍗", img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop" },
    { name: "족발", emoji: "🐷", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop" },
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
