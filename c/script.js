// 좌측 필터칩 내비 — 스크롤 시 현재 카드에 해당하는 칩 하이라이트
(function () {
  var cards = document.querySelectorAll('.info-card[id]');
  var chips = document.querySelectorAll('.chip-nav .chip');
  if (!cards.length || !chips.length) return;

  var ticking = false;

  function update() {
    var current = 0;
    cards.forEach(function (card, i) {
      if (card.getBoundingClientRect().top < window.innerHeight * 0.45) {
        current = i;
      }
    });

    chips.forEach(function (c, i) {
      c.classList.toggle('active', i === current);
    });
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        update();
        ticking = false;
      });
      ticking = true;
    }
  });

  update();
})();
