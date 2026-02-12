// 탭 전환
document.querySelectorAll('.tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('panel-' + btn.getAttribute('data-tab')).classList.add('active');
  });
});

// 부드러운 스크롤
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
