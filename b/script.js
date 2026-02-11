// /b/ 수원찬스돔나이트 — 사이드 TOC 자동 생성 + 스크롤 추적
(function () {
  "use strict";

  var sections = document.querySelectorAll('main section[id]');
  if (!sections.length) return;

  var toc = document.createElement('nav');
  toc.className = 'side-toc';
  toc.setAttribute('aria-label', '페이지 목차');

  sections.forEach(function (sec) {
    var heading = sec.querySelector('h2');
    if (!heading) return;
    var a = document.createElement('a');
    a.href = '#' + sec.id;
    a.textContent = heading.textContent.substring(0, 16);
    toc.appendChild(a);
  });

  document.body.appendChild(toc);

  var tocLinks = toc.querySelectorAll('a');
  var ticking = false;

  function updateToc() {
    var current = '';
    sections.forEach(function (sec) {
      var rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.4) {
        current = sec.id;
      }
    });

    tocLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateToc();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateToc();
})();
