// Timeline stepper + right dot progress + card TOC highlight
(function () {
  var phases = document.querySelectorAll('.timeline-phase[id]');
  var dots = document.querySelectorAll('.progress-dots .dot');
  var tocCards = document.querySelectorAll('.card-toc .toc-card');
  if (!phases.length) return;

  var ticking = false;

  function update() {
    var current = 0;
    phases.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.45) {
        current = i;
      }
    });

    dots.forEach(function (d, i) {
      d.classList.toggle('active', i <= current);
    });

    tocCards.forEach(function (c, i) {
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
