const menus = {
  asian: [
    { name: "Pad Thai", emoji: "🍜", img: "https://source.unsplash.com/400x300/?pad-thai" },
    { name: "Fried Rice", emoji: "🍳", img: "https://source.unsplash.com/400x300/?fried-rice" },
    { name: "Sushi", emoji: "🍣", img: "https://source.unsplash.com/400x300/?sushi" },
    { name: "Ramen", emoji: "🍜", img: "https://source.unsplash.com/400x300/?ramen" },
    { name: "Curry", emoji: "🍛", img: "https://source.unsplash.com/400x300/?curry" },
    { name: "Pho", emoji: "🥣", img: "https://source.unsplash.com/400x300/?pho" },
    { name: "Dumplings", emoji: "🥟", img: "https://source.unsplash.com/400x300/?dumplings" },
    { name: "Bibimbap", emoji: "🍚", img: "https://source.unsplash.com/400x300/?bibimbap" },
    { name: "Teriyaki Chicken", emoji: "🍗", img: "https://source.unsplash.com/400x300/?teriyaki-chicken" },
    { name: "Kung Pao Chicken", emoji: "🌶️", img: "https://source.unsplash.com/400x300/?kung-pao-chicken" },
  ],
  western: [
    { name: "Pasta Carbonara", emoji: "🍝", img: "https://source.unsplash.com/400x300/?pasta-carbonara" },
    { name: "Margherita Pizza", emoji: "🍕", img: "https://source.unsplash.com/400x300/?margherita-pizza" },
    { name: "Grilled Steak", emoji: "🥩", img: "https://source.unsplash.com/400x300/?grilled-steak" },
    { name: "Burger & Fries", emoji: "🍔", img: "https://source.unsplash.com/400x300/?burger-fries" },
    { name: "Risotto", emoji: "🍚", img: "https://source.unsplash.com/400x300/?risotto" },
    { name: "Fish & Chips", emoji: "🐟", img: "https://source.unsplash.com/400x300/?fish-and-chips" },
    { name: "Roast Chicken", emoji: "🍗", img: "https://source.unsplash.com/400x300/?roast-chicken" },
    { name: "Mac & Cheese", emoji: "🧀", img: "https://source.unsplash.com/400x300/?mac-and-cheese" },
  ],
  mexican: [
    { name: "Tacos", emoji: "🌮", img: "https://source.unsplash.com/400x300/?tacos" },
    { name: "Burrito Bowl", emoji: "🥗", img: "https://source.unsplash.com/400x300/?burrito-bowl" },
    { name: "Quesadilla", emoji: "🧀", img: "https://source.unsplash.com/400x300/?quesadilla" },
    { name: "Enchiladas", emoji: "🌶️", img: "https://source.unsplash.com/400x300/?enchiladas" },
    { name: "Nachos", emoji: "🔥", img: "https://source.unsplash.com/400x300/?nachos" },
    { name: "Fajitas", emoji: "🫑", img: "https://source.unsplash.com/400x300/?fajitas" },
  ],
  comfort: [
    { name: "Fried Chicken", emoji: "🍗", img: "https://source.unsplash.com/400x300/?fried-chicken" },
    { name: "BBQ Ribs", emoji: "🍖", img: "https://source.unsplash.com/400x300/?bbq-ribs" },
    { name: "Grilled Cheese", emoji: "🧀", img: "https://source.unsplash.com/400x300/?grilled-cheese" },
    { name: "Meatloaf", emoji: "🥩", img: "https://source.unsplash.com/400x300/?meatloaf" },
    { name: "Pot Pie", emoji: "🥧", img: "https://source.unsplash.com/400x300/?pot-pie" },
    { name: "Lasagna", emoji: "🍝", img: "https://source.unsplash.com/400x300/?lasagna" },
    { name: "Mashed Potatoes & Gravy", emoji: "🥔", img: "https://source.unsplash.com/400x300/?mashed-potatoes" },
  ],
  healthy: [
    { name: "Grilled Salmon", emoji: "🐟", img: "https://source.unsplash.com/400x300/?grilled-salmon" },
    { name: "Quinoa Bowl", emoji: "🥗", img: "https://source.unsplash.com/400x300/?quinoa-bowl" },
    { name: "Caesar Salad", emoji: "🥬", img: "https://source.unsplash.com/400x300/?caesar-salad" },
    { name: "Veggie Stir-fry", emoji: "🥦", img: "https://source.unsplash.com/400x300/?vegetable-stir-fry" },
    { name: "Poke Bowl", emoji: "🍣", img: "https://source.unsplash.com/400x300/?poke-bowl" },
    { name: "Chicken Breast & Veggies", emoji: "🍗", img: "https://source.unsplash.com/400x300/?chicken-vegetables" },
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
