(() => {
  'use strict';

  const safeRemove = key => {
    try { localStorage.removeItem(key); } catch (_) { /* storage may be unavailable */ }
  };

  // Remove answers that are no longer applicable after a parent decision changes.
  const pruneInactiveAnswers = () => {
    if (typeof activeQuestions !== 'function' || typeof responses !== 'object') return;
    const activeKeys = new Set(activeQuestions().map(question => question.key));
    ['whatsappVolume', 'maintenanceSla', 'consent'].forEach(key => {
      if (!activeKeys.has(key) && Object.prototype.hasOwnProperty.call(responses, key)) {
        delete responses[key];
      }
    });
    if (typeof save === 'function') save();
  };

  // Editing a response from the review screen should return to review after one save.
  const originalNext = document.getElementById('next')?.onclick;
  const next = document.getElementById('next');
  if (next && typeof originalNext === 'function') {
    next.onclick = event => {
      if (typeof editReturn !== 'undefined' && editReturn) {
        pruneInactiveAnswers();
        editReturn = false;
        if (typeof showReview === 'function') showReview();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      originalNext.call(next, event);
    };
  }

  document.getElementById('answer')?.addEventListener('change', () => {
    window.setTimeout(pruneInactiveAnswers, 0);
  });

  // Improve recovery from corrupted browser state without breaking a valid assessment.
  window.addEventListener('error', event => {
    const message = String(event?.message || 'Unexpected application error');
    console.error('Discovery portal runtime error:', event.error || message);
    const existing = document.getElementById('runtimeError');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'runtimeError';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;padding:14px 16px;border-radius:12px;background:#7f1d1d;color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.3);font:600 14px/1.4 system-ui';
    banner.innerHTML = '<strong>The assessment encountered a browser-state error.</strong> Reload the page. If the issue continues, use Restart Assessment to clear the saved draft.';
    document.body.appendChild(banner);
  });

  window.addEventListener('unhandledrejection', event => {
    console.error('Discovery portal rejected promise:', event.reason);
  });

  // Storage can be unavailable in strict private modes. Confirm access and degrade gracefully.
  try {
    const probe = '__discovery_storage_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch (error) {
    console.warn('Local storage is unavailable; save-and-resume is disabled.', error);
  }

  // Prevent old incompatible versions of the data model from causing repeated failures.
  try {
    const raw = localStorage.getItem('propDiscoveryAdaptive');
    if (raw) JSON.parse(raw);
    const chat = localStorage.getItem('discoveryChatV2');
    if (chat) JSON.parse(chat);
  } catch (error) {
    console.warn('Invalid saved application state was removed.', error);
    safeRemove('propDiscoveryAdaptive');
    safeRemove('propDiscoveryAdaptiveStep');
    safeRemove('discoveryChatV2');
  }
})();
