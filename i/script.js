// Progress bar and step navigation
(function() {
  const progressFill = document.getElementById('progress-fill');
  const steps = document.querySelectorAll('.progress-steps .step');
  const stepCards = document.querySelectorAll('.step-card');
  const totalSteps = steps.length;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);

    if (progressFill) {
      progressFill.style.width = scrollPercent + '%';
    }

    // Determine current step based on scroll position
    let currentStep = 1;
    stepCards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.5) {
        currentStep = index + 1;
      }
    });

    // Update active step
    steps.forEach((step, index) => {
      if (index + 1 <= currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  // Throttle scroll events
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial update
  updateProgress();
})();
