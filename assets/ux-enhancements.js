(() => {
  'use strict';

  const status = document.getElementById('connectionStatus');
  const progress = document.querySelector('.track[role="progressbar"]');
  const openAeroButtons = document.querySelectorAll('[data-open-aero]');

  function announceConnection() {
    if (!status) return;
    const online = navigator.onLine;
    status.textContent = online
      ? 'Connection restored. Aero Discovery can use configured online integrations.'
      : 'You are offline. The assessment and Aero local knowledge remain available in this browser.';
    status.hidden = false;
    window.clearTimeout(announceConnection.timer);
    announceConnection.timer = window.setTimeout(() => { status.hidden = true; }, 4200);
  }

  function syncProgress() {
    if (!progress) return;
    const percent = Number.parseInt(document.getElementById('percent')?.textContent || '0', 10);
    progress.setAttribute('aria-valuenow', String(Number.isFinite(percent) ? percent : 0));
    progress.setAttribute('aria-valuetext', `${Number.isFinite(percent) ? percent : 0}% complete`);
  }

  openAeroButtons.forEach(button => button.addEventListener('click', () => window.AeroAgent?.open?.()));
  window.addEventListener('online', announceConnection);
  window.addEventListener('offline', announceConnection);
  document.addEventListener('discovery:viewchange', () => {
    syncProgress();
    const target = document.body.classList.contains('assessment-active')
      ? document.getElementById('mainContent')
      : document.getElementById('productLanding');
    target?.focus({ preventScroll: true });
  });
  document.getElementById('next')?.addEventListener('click', () => window.setTimeout(syncProgress, 0));
  document.getElementById('back')?.addEventListener('click', () => window.setTimeout(syncProgress, 0));

  const observer = new MutationObserver(syncProgress);
  const percentNode = document.getElementById('percent');
  if (percentNode) observer.observe(percentNode, { childList: true, characterData: true, subtree: true });
  syncProgress();
})();