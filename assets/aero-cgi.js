(() => {
  'use strict';

  const SPRITE = 'assets/aero-cgi-sprite.webp';
  const COLS = 5;
  const ROWS = 4;
  const FRAME_CROP = { x: 0.14, y: 0.01, width: 0.72, height: 0.82 };
  const FRAMES = {
    idle: 0, wave: 1, present: 2, thumbs: 3, welcome: 4,
    thinking: 5, curious: 6, excited: 7, happy: 8, surprised: 9,
    explaining: 10, data: 11, confident: 12, alert: 13, concerned: 14,
    success: 15, thanks: 16, laughing: 17, working: 18, sleeping: 19
  };
  const SEQUENCES = {
    idle: ['idle', 'curious', 'idle'],
    wave: ['idle', 'wave', 'present', 'wave'],
    welcome: ['welcome', 'wave', 'welcome'],
    thinking: ['thinking', 'curious', 'thinking'],
    working: ['working', 'data', 'working'],
    happy: ['happy', 'success', 'happy'],
    success: ['success', 'thanks', 'success'],
    explaining: ['explaining', 'present', 'explaining'],
    alert: ['alert', 'concerned', 'alert'],
    sleeping: ['sleeping']
  };

  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = 'high';
  image.src = SPRITE;

  const instances = new Set();
  let activeState = 'idle';
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let raf = 0;
  let loadError = null;

  const ready = new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => {
      loadError = new Error(`Unable to load Aero CGI sprite: ${SPRITE}`);
      document.documentElement.dataset.aeroCgi = 'error';
      reject(loadError);
    }, { once: true });
  });

  function paintFallback(instance) {
    instance.classList.add('aero-cgi-fallback');
    instance.setAttribute('data-render-status', 'fallback');
  }

  function draw(instance, state) {
    if (!instance?.isConnected || instance.dataset.visible === 'false' || document.hidden) return;
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;

    const index = FRAMES[state] ?? FRAMES.idle;
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const cellW = image.naturalWidth / COLS;
    const cellH = image.naturalHeight / ROWS;
    const sx = col * cellW + cellW * FRAME_CROP.x;
    const sy = row * cellH + cellH * FRAME_CROP.y;
    const sw = cellW * FRAME_CROP.width;
    const sh = cellH * FRAME_CROP.height;

    const canvas = instance.querySelector('canvas');
    const ctx = canvas?.getContext('2d', { alpha: true, desynchronized: true });
    if (!canvas || !ctx) return;

    const bounds = instance.getBoundingClientRect();
    const cssWidth = Math.max(48, Math.round(bounds.width || Number(instance.dataset.renderWidth) || 246));
    const cssHeight = Math.max(54, Math.round(bounds.height || Number(instance.dataset.renderHeight) || 282));
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetW = Math.round(cssWidth * ratio);
    const targetH = Math.round(cssHeight * ratio);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.clearRect(0, 0, targetW, targetH);
    const scale = Math.min(targetW / sw, targetH / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (targetW - dw) / 2;
    const dy = (targetH - dh) / 2;
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

    instance.classList.remove('aero-cgi-fallback');
    instance.setAttribute('data-render-status', 'ready');
    document.documentElement.dataset.aeroCgi = 'ready';
  }

  function animate(instance) {
    clearInterval(instance._aeroTimer);
    const state = instance.dataset.state || activeState;
    const sequence = SEQUENCES[state] || [state];
    let index = 0;
    draw(instance, sequence[0]);
    if (sequence.length > 1 && instance.dataset.visible !== 'false' && !document.hidden) {
      instance._aeroTimer = setInterval(() => draw(instance, sequence[++index % sequence.length]), 520);
    }
  }

  function inferSize(source, fallback = 'brand') {
    if (source?.dataset?.aeroSize) return source.dataset.aeroSize;
    if (source?.classList?.contains('landing-skunkie')) return 'hero';
    if (source?.classList?.contains('wizard-avatar')) return 'wizard';
    if (source?.classList?.contains('aero-launcher-avatar')) return 'launcher';
    if (source?.classList?.contains('aero-chat-avatar')) return 'chat';
    return fallback;
  }

  function make(source, size = 'brand') {
    if (!source) return null;
    if (source.classList?.contains('aero-cgi')) return source;

    const wrap = document.createElement('span');
    wrap.className = 'aero-cgi';
    wrap.dataset.size = inferSize(source, size);
    wrap.dataset.state = source.dataset?.aeroState || activeState;
    wrap.dataset.visible = 'true';
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', source.getAttribute?.('aria-label') || source.alt || 'Aero Discovery Agent');
    wrap.innerHTML = '<canvas aria-hidden="true" width="246" height="282"></canvas>';
    source.replaceWith(wrap);

    instances.add(wrap);
    visibilityObserver.observe(wrap);
    wrap.addEventListener('click', () => window.AeroAgent?.open?.());

    if (image.complete && image.naturalWidth) animate(wrap);
    else {
      paintFallback(wrap);
      ready.then(() => animate(wrap)).catch(() => paintFallback(wrap));
    }
    return wrap;
  }

  function upgrade(root = document) {
    const selector = [
      'img.brand-avatar', 'img.wizard-avatar', 'img.landing-skunkie',
      '[data-aero-agent]:not(.aero-cgi)', '.aero-placeholder[data-aero-agent]'
    ].join(',');

    root.querySelectorAll?.(selector).forEach(node => {
      if (node.dataset.aeroUpgraded === 'true') return;
      node.dataset.aeroUpgraded = 'true';
      make(node, inferSize(node));
    });
  }

  function setState(state = 'idle') {
    activeState = Object.prototype.hasOwnProperty.call(FRAMES, state) ? state : 'idle';
    instances.forEach(instance => {
      instance.dataset.state = activeState;
      animate(instance);
    });
  }

  function applyPointer() {
    raf = 0;
    if (matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    instances.forEach(instance => {
      if (instance.dataset.visible === 'false') return;
      const rect = instance.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (pointer.x - cx) / Math.max(innerWidth, 1);
      const dy = (pointer.y - cy) / Math.max(innerHeight, 1);
      const proximity = Math.max(0, 1 - Math.hypot(pointer.x - cx, pointer.y - cy) / 720);
      instance.style.setProperty('--aero-ry', `${Math.max(-14, Math.min(14, dx * 34)) * proximity}deg`);
      instance.style.setProperty('--aero-rx', `${Math.max(-11, Math.min(11, -dy * 28)) * proximity}deg`);
      instance.style.setProperty('--aero-tx', `${Math.max(-9, Math.min(9, dx * 22)) * proximity}px`);
      instance.style.setProperty('--aero-ty', `${Math.max(-7, Math.min(7, dy * 18)) * proximity}px`);
    });
  }

  const visibilityObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    const instance = entry.target;
    instance.dataset.visible = String(entry.isIntersecting);
    if (entry.isIntersecting) animate(instance);
    else clearInterval(instance._aeroTimer);
  }), { rootMargin: '160px' });

  const mutationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches?.('[data-aero-agent],img.brand-avatar,img.wizard-avatar,img.landing-skunkie')) upgrade(node.parentElement || document);
      else upgrade(node);
    }));
  });

  document.addEventListener('pointermove', event => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!raf) raf = requestAnimationFrame(applyPointer);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => instances.forEach(instance => {
    if (document.hidden) clearInterval(instance._aeroTimer);
    else animate(instance);
  }));
  window.addEventListener('resize', () => instances.forEach(animate), { passive: true });

  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  window.AeroCGI = {
    ready: ready.catch(error => { console.error(error); return null; }),
    upgrade,
    create: make,
    setState,
    frames: Object.keys(FRAMES),
    sprite: SPRITE,
    diagnostics: () => ({
      status: document.documentElement.dataset.aeroCgi || 'loading',
      image: { complete: image.complete, width: image.naturalWidth, height: image.naturalHeight },
      instances: instances.size,
      rendered: [...instances].filter(item => item.dataset.renderStatus === 'ready').length,
      fallback: [...instances].filter(item => item.dataset.renderStatus === 'fallback').length,
      error: loadError?.message || null
    })
  };

  document.documentElement.dataset.aeroCgi = 'loading';
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => upgrade(), { once: true });
  else upgrade();
})();
