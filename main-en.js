const menus = {
  asian: [
    { name: "Pad Thai", emoji: "🍜" },
    { name: "Fried Rice", emoji: "🍳" },
    { name: "Sushi", emoji: "🍣" },
    { name: "Ramen", emoji: "🍜" },
    { name: "Curry", emoji: "🍛" },
    { name: "Pho", emoji: "🥣" },
    { name: "Dumplings", emoji: "🥟" },
    { name: "Bibimbap", emoji: "🍚" },
    { name: "Teriyaki Chicken", emoji: "🍗" },
    { name: "Kung Pao Chicken", emoji: "🌶️" },
  ],
  western: [
    { name: "Pasta Carbonara", emoji: "🍝" },
    { name: "Margherita Pizza", emoji: "🍕" },
    { name: "Grilled Steak", emoji: "🥩" },
    { name: "Burger & Fries", emoji: "🍔" },
    { name: "Risotto", emoji: "🍚" },
    { name: "Fish & Chips", emoji: "🐟" },
    { name: "Roast Chicken", emoji: "🍗" },
    { name: "Mac & Cheese", emoji: "🧀" },
  ],
  mexican: [
    { name: "Tacos", emoji: "🌮" },
    { name: "Burrito Bowl", emoji: "🥗" },
    { name: "Quesadilla", emoji: "🧀" },
    { name: "Enchiladas", emoji: "🌶️" },
    { name: "Nachos", emoji: "🔥" },
    { name: "Fajitas", emoji: "🫑" },
  ],
  comfort: [
    { name: "Fried Chicken", emoji: "🍗" },
    { name: "BBQ Ribs", emoji: "🍖" },
    { name: "Grilled Cheese", emoji: "🧀" },
    { name: "Meatloaf", emoji: "🥩" },
    { name: "Pot Pie", emoji: "🥧" },
    { name: "Lasagna", emoji: "🍝" },
    { name: "Mashed Potatoes & Gravy", emoji: "🥔" },
  ],
  healthy: [
    { name: "Grilled Salmon", emoji: "🐟" },
    { name: "Quinoa Bowl", emoji: "🥗" },
    { name: "Caesar Salad", emoji: "🥬" },
    { name: "Veggie Stir-fry", emoji: "🥦" },
    { name: "Poke Bowl", emoji: "🍣" },
    { name: "Chicken Breast & Veggies", emoji: "🍗" },
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
