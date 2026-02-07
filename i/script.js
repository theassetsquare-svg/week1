// Side progress TOC — 데스크탑에서 현재 섹션 하이라이트
(function () {
  var sections = document.querySelectorAll('main section[id]');
  if (!sections.length) return;

  // 사이드 TOC 생성
  var toc = document.createElement('nav');
  toc.className = 'side-toc';
  toc.setAttribute('aria-label', '페이지 목차');

  sections.forEach(function (sec) {
    var heading = sec.querySelector('h2');
    if (!heading) return;
    var a = document.createElement('a');
    a.href = '#' + sec.id;
    a.textContent = heading.textContent.replace(/^.+—\s*/, '').substring(0, 18);
    toc.appendChild(a);
  });

  document.body.appendChild(toc);

  // 스크롤 시 현재 섹션 하이라이트
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
  });

  updateToc();
})();
