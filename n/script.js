// 아코디언 토글
document.querySelectorAll('.accordion-trigger').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var item = btn.closest('.accordion-item');
    var body = item.querySelector('.accordion-body');
    var isOpen = item.classList.contains('open');

    // 모두 닫기
    document.querySelectorAll('.accordion-item').forEach(function(el) {
      el.classList.remove('open');
      el.querySelector('.accordion-body').style.maxHeight = null;
      el.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
    });

    // 현재 항목 토글
    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// 부드러운 스크롤
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
