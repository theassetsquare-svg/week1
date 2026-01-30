const menus = {
  asian: [
    { name: "Pad Thai", emoji: "🍜", img: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop" },
    { name: "Fried Rice", emoji: "🍳", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop" },
    { name: "Sushi", emoji: "🍣", img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop" },
    { name: "Ramen", emoji: "🍜", img: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=300&fit=crop" },
    { name: "Curry", emoji: "🍛", img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop" },
    { name: "Pho", emoji: "🥣", img: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop" },
    { name: "Dumplings", emoji: "🥟", img: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop" },
    { name: "Bibimbap", emoji: "🍚", img: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400&h=300&fit=crop" },
    { name: "Teriyaki Chicken", emoji: "🍗", img: "https://images.unsplash.com/photo-1632558610168-5aa0e9a3a4e1?w=400&h=300&fit=crop" },
    { name: "Kung Pao Chicken", emoji: "🌶️", img: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop" },
  ],
  western: [
    { name: "Pasta Carbonara", emoji: "🍝", img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop" },
    { name: "Margherita Pizza", emoji: "🍕", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop" },
    { name: "Grilled Steak", emoji: "🥩", img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop" },
    { name: "Burger & Fries", emoji: "🍔", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop" },
    { name: "Risotto", emoji: "🍚", img: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop" },
    { name: "Fish & Chips", emoji: "🐟", img: "https://images.unsplash.com/photo-1579208030886-b1f5b8d7e8f6?w=400&h=300&fit=crop" },
    { name: "Roast Chicken", emoji: "🍗", img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop" },
    { name: "Mac & Cheese", emoji: "🧀", img: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400&h=300&fit=crop" },
  ],
  mexican: [
    { name: "Tacos", emoji: "🌮", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop" },
    { name: "Burrito Bowl", emoji: "🥗", img: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop" },
    { name: "Quesadilla", emoji: "🧀", img: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&h=300&fit=crop" },
    { name: "Enchiladas", emoji: "🌶️", img: "https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=400&h=300&fit=crop" },
    { name: "Nachos", emoji: "🔥", img: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop" },
    { name: "Fajitas", emoji: "🫑", img: "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=400&h=300&fit=crop" },
  ],
  comfort: [
    { name: "Fried Chicken", emoji: "🍗", img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop" },
    { name: "BBQ Ribs", emoji: "🍖", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop" },
    { name: "Grilled Cheese", emoji: "🧀", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop" },
    { name: "Meatloaf", emoji: "🥩", img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop" },
    { name: "Pot Pie", emoji: "🥧", img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop" },
    { name: "Lasagna", emoji: "🍝", img: "https://images.unsplash.com/photo-1619895092538-128341789043?w=400&h=300&fit=crop" },
    { name: "Mashed Potatoes & Gravy", emoji: "🥔", img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop" },
  ],
  healthy: [
    { name: "Grilled Salmon", emoji: "🐟", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop" },
    { name: "Quinoa Bowl", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" },
    { name: "Caesar Salad", emoji: "🥬", img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop" },
    { name: "Veggie Stir-fry", emoji: "🥦", img: "https://images.unsplash.com/photo-1543339308-d595c3e5a8b6?w=400&h=300&fit=crop" },
    { name: "Poke Bowl", emoji: "🍣", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop" },
    { name: "Chicken Breast & Veggies", emoji: "🍗", img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop" },
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
