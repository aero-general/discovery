(() => {
  'use strict';

  const PRIMARY_FALLBACK = 'assets/skunkie.svg';
  const SECONDARY_FALLBACK = 'assets/favicon.svg';
  const observed = new WeakSet();

  function ensureFallback(instance) {
    if (!instance || observed.has(instance)) return;
    observed.add(instance);

    let image = instance.querySelector('.aero-cgi-vector-fallback');
    if (!image) {
      image = document.createElement('img');
      image.className = 'aero-cgi-vector-fallback';
      image.src = PRIMARY_FALLBACK;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.decoding = 'async';
      instance.appendChild(image);
    }

    const sync = () => {
      const canvasReady = instance.dataset.renderStatus === 'ready';
      image.hidden = canvasReady;
      instance.classList.toggle('aero-vector-active', !canvasReady);
      if (!canvasReady && image.complete && image.naturalWidth > 0) {
        instance.dataset.vectorFallback = 'ready';
        document.documentElement.dataset.aeroFallback = 'ready';
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(instance, { attributes: true, attributeFilter: ['data-render-status', 'data-state'] });
    image.addEventListener('load', sync);
    image.addEventListener('error', () => {
      if (!image.dataset.secondary) {
        image.dataset.secondary = 'true';
        image.src = SECONDARY_FALLBACK;
        return;
      }
      instance.dataset.vectorFallback = 'error';
      console.error('Unable to load Aero vector fallback assets.');
    });
    sync();
  }

  function upgrade(root = document) {
    if (root.matches?.('.aero-cgi')) ensureFallback(root);
    root.querySelectorAll?.('.aero-cgi').forEach(ensureFallback);
  }

  const observer = new MutationObserver(mutations => mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) upgrade(node);
    });
  }));

  observer.observe(document.documentElement, { childList: true, subtree: true });
  upgrade();

  const attachDiagnostics = () => {
    if (!window.AeroCGI || window.AeroCGI.__recoveryAttached) return;
    const original = window.AeroCGI.diagnostics?.bind(window.AeroCGI);
    window.AeroCGI.diagnostics = () => {
      const base = original ? original() : {};
      const instances = [...document.querySelectorAll('.aero-cgi')];
      return {
        ...base,
        vectorFallback: instances.filter(item => item.dataset.vectorFallback === 'ready' && item.dataset.renderStatus !== 'ready').length,
        visibleInstances: instances.filter(item => item.getClientRects().length > 0).length
      };
    };
    window.AeroCGI.__recoveryAttached = true;
  };

  attachDiagnostics();
  document.addEventListener('aero:ready', attachDiagnostics);
  window.setTimeout(() => { upgrade(); attachDiagnostics(); }, 250);
})();
