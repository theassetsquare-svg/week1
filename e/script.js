const tabs = document.querySelectorAll('.tab');
const cards = document.querySelectorAll('.card');
const details = document.querySelectorAll('.detail');

function show(target) {
  details.forEach((d) => d.classList.toggle('active', d.id === target));
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.target === target));
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => show(tab.dataset.target));
});

cards.forEach((card) => {
  card.addEventListener('click', () => show(card.dataset.target));
});
