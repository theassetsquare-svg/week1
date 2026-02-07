/* /b/ 수원찬스돔나이트 — 우측 스텝퍼 내비 + 스크롤 추적 */
(function () {
  "use strict";

  var stepper = document.getElementById("side-stepper");
  if (!stepper) return;

  var items = Array.prototype.slice.call(stepper.querySelectorAll(".step-item"));
  var sections = [];

  items.forEach(function (item) {
    var targetId = item.getAttribute("data-target");
    var sec = document.getElementById(targetId);
    if (sec) sections.push({ el: sec, item: item });

    item.addEventListener("click", function () {
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (!sections.length) return;

  var activeIndex = -1;

  function updateStepper() {
    var scrollY = window.scrollY || window.pageYOffset;
    var viewH = window.innerHeight;
    var threshold = viewH * 0.35;
    var newIndex = -1;

    for (var i = sections.length - 1; i >= 0; i--) {
      var rect = sections[i].el.getBoundingClientRect();
      if (rect.top <= threshold) {
        newIndex = i;
        break;
      }
    }

    if (newIndex === activeIndex) return;
    activeIndex = newIndex;

    items.forEach(function (item, idx) {
      item.classList.remove("active", "done");
      if (idx < activeIndex) item.classList.add("done");
      else if (idx === activeIndex) item.classList.add("active");
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateStepper();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateStepper();
})();
