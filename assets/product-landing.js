(() => {
  'use strict';

  const landing = document.getElementById('productLanding');
  const app = document.getElementById('assessmentApp');
  const startButtons = document.querySelectorAll('[data-start-assessment]');
  const resumeButton = document.getElementById('resumeAssessment');
  const homeButton = document.getElementById('assessmentHome');
  const progressKey = 'propDiscoveryAdaptiveStep';
  const responseKey = 'propDiscoveryAdaptive';

  if (!landing || !app) return;

  const hasSavedAssessment = () => {
    try {
      const data = JSON.parse(localStorage.getItem(responseKey) || '{}');
      return data && typeof data === 'object' && Object.keys(data).length > 0;
    } catch (_) {
      return false;
    }
  };

  const showAssessment = ({ resume = false } = {}) => {
    landing.hidden = true;
    app.hidden = false;
    document.body.classList.add('assessment-active');
    history.replaceState({ view: 'assessment' }, '', '#assessment');

    if (resume && typeof current === 'number') {
      const saved = Number(localStorage.getItem(progressKey));
      if (Number.isFinite(saved) && saved >= 0) current = saved;
    }
    if (typeof render === 'function') render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('mainContent')?.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('discovery:viewchange', { detail: { view: 'assessment', resume } }));
  };

  const showLanding = () => {
    app.hidden = true;
    landing.hidden = false;
    document.body.classList.remove('assessment-active');
    history.replaceState({ view: 'landing' }, '', location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('landingTitle')?.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('discovery:viewchange', { detail: { view: 'landing' } }));
  };

  startButtons.forEach(button => button.addEventListener('click', () => showAssessment({ resume: false })));
  resumeButton?.addEventListener('click', () => showAssessment({ resume: true }));
  homeButton?.addEventListener('click', showLanding);

  if (resumeButton) {
    const available = hasSavedAssessment();
    resumeButton.hidden = !available;
    resumeButton.setAttribute('aria-hidden', String(!available));
  }

  if (location.hash === '#assessment') showAssessment({ resume: hasSavedAssessment() });
  else showLanding();

  window.addEventListener('popstate', () => {
    if (location.hash === '#assessment') showAssessment({ resume: hasSavedAssessment() });
    else showLanding();
  });

  window.ProductLanding = { showLanding, showAssessment, hasSavedAssessment };
})();