(() => {
  'use strict';

  const instances = new Set();
  const STATES = new Set([
    'idle','wave','present','thumbs','welcome','thinking','curious','excited','happy',
    'surprised','explaining','data','confident','alert','concerned','success','thanks',
    'laughing','working','sleeping'
  ]);

  let activeState = 'idle';
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let raf = 0;
  let animationFrame = 0;
  let lastTime = performance.now();

  const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function stateProfile(state, t) {
    const blinkCycle = (t % 4.6);
    const blink = blinkCycle > 4.42 ? Math.max(0.08, 1 - (blinkCycle - 4.42) * 8) : 1;
    const profile = {
      eyeScale: blink,
      mouth: 'smile',
      brow: 0,
      bob: Math.sin(t * 2.1) * 2.4,
      tilt: Math.sin(t * 1.15) * 0.02,
      leftArm: -0.22,
      rightArm: 0.22,
      pulse: 0,
      antenna: Math.sin(t * 3.4) * 2,
      accent: '#42d3ff'
    };

    if (['happy','success','excited','thanks','laughing','thumbs'].includes(state)) {
      profile.mouth = 'open-smile';
      profile.bob = Math.abs(Math.sin(t * 4.2)) * -7;
      profile.pulse = (Math.sin(t * 5) + 1) / 2;
      profile.accent = '#58e39b';
    }
    if (['thinking','curious'].includes(state)) {
      profile.mouth = 'small';
      profile.brow = -0.12;
      profile.tilt = -0.06 + Math.sin(t * 1.6) * 0.015;
      profile.rightArm = -0.8;
      profile.accent = '#b48cff';
    }
    if (['alert','concerned','surprised'].includes(state)) {
      profile.mouth = state === 'surprised' ? 'o' : 'flat';
      profile.brow = 0.2;
      profile.eyeScale = 1.15;
      profile.bob = Math.sin(t * 18) * 1.5;
      profile.accent = '#ff9b62';
    }
    if (['working','data','explaining','present'].includes(state)) {
      profile.mouth = 'talk';
      profile.rightArm = -0.55 + Math.sin(t * 3.8) * 0.1;
      profile.accent = '#42d3ff';
    }
    if (['wave','welcome'].includes(state)) {
      profile.mouth = 'open-smile';
      profile.rightArm = -1.3 + Math.sin(t * 7.2) * 0.35;
      profile.accent = '#58e39b';
    }
    if (state === 'sleeping') {
      profile.eyeScale = 0.08;
      profile.mouth = 'small';
      profile.bob = Math.sin(t * 1.5) * 3;
      profile.tilt = 0.05;
      profile.accent = '#7d91a8';
    }
    return profile;
  }

  function drawArm(ctx, shoulderX, shoulderY, angle, side, accent) {
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(angle * side);
    ctx.strokeStyle = '#274963';
    ctx.lineWidth = 17;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 47);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 52, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAvatar(instance, time) {
    if (!instance.isConnected || instance.dataset.visible === 'false' || document.hidden) return;
    const canvas = instance.querySelector('canvas');
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;

    const cssWidth = Math.max(48, instance.clientWidth || Number(instance.dataset.renderWidth || 246));
    const cssHeight = Math.max(54, instance.clientHeight || Number(instance.dataset.renderHeight || 282));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(cssWidth * ratio);
    const targetH = Math.round(cssHeight * ratio);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const state = instance.dataset.state || activeState;
    const p = stateProfile(state, time / 1000);
    const scale = Math.min(cssWidth / 246, cssHeight / 282);
    const ox = cssWidth / 2;
    const oy = cssHeight * 0.52 + p.bob * scale;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(p.tilt);
    ctx.scale(scale, scale);

    const glow = ctx.createRadialGradient(0, -20, 10, 0, -10, 122);
    glow.addColorStop(0, `${p.accent}3f`);
    glow.addColorStop(1, 'rgba(66,211,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -12, 122, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath();
    ctx.ellipse(0, 104, 62, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    drawArm(ctx, -69, 25, p.leftArm, -1, p.accent);
    drawArm(ctx, 69, 25, p.rightArm, 1, p.accent);

    const bodyGradient = ctx.createLinearGradient(-70, -10, 70, 105);
    bodyGradient.addColorStop(0, '#315c77');
    bodyGradient.addColorStop(1, '#17384f');
    ctx.fillStyle = bodyGradient;
    roundRect(ctx, -67, -10, 134, 120, 42);
    ctx.fill();

    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.85;
    roundRect(ctx, -45, 28, 90, 50, 18);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(-18, 53, 5 + p.pulse * 2, 0, Math.PI * 2);
    ctx.arc(0, 53, 5 + p.pulse * 2, 0, Math.PI * 2);
    ctx.arc(18, 53, 5 + p.pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eaf8ff';
    roundRect(ctx, -77, -98, 154, 102, 42);
    ctx.fill();
    ctx.strokeStyle = '#254d67';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#17384f';
    roundRect(ctx, -62, -84, 124, 70, 29);
    ctx.fill();

    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -98);
    ctx.lineTo(0, -116);
    ctx.stroke();
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(0, -121 + p.antenna, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(-25, -54);
    ctx.rotate(-p.brow);
    ctx.strokeStyle = '#94dbff';
    ctx.lineWidth = 8 * Math.max(0.08, p.eyeScale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(25, -54);
    ctx.rotate(p.brow);
    ctx.strokeStyle = '#94dbff';
    ctx.lineWidth = 8 * Math.max(0.08, p.eyeScale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = p.accent;
    ctx.fillStyle = p.accent;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    if (p.mouth === 'open-smile') {
      ctx.beginPath();
      ctx.arc(0, -34, 14, 0, Math.PI);
      ctx.stroke();
    } else if (p.mouth === 'o') {
      ctx.beginPath();
      ctx.arc(0, -31, 7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.mouth === 'flat') {
      ctx.beginPath();
      ctx.moveTo(-11, -29);
      ctx.lineTo(11, -29);
      ctx.stroke();
    } else if (p.mouth === 'talk') {
      const talk = 5 + Math.abs(Math.sin(time / 110)) * 5;
      ctx.beginPath();
      ctx.ellipse(0, -31, 10, talk, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.mouth === 'small') {
      ctx.beginPath();
      ctx.arc(0, -29, 7, 0.1, Math.PI - 0.1);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, -36, 15, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }

    if (state === 'sleeping') {
      ctx.fillStyle = '#b8d3e4';
      ctx.font = '700 18px system-ui';
      ctx.fillText('Z', 71, -83);
      ctx.font = '700 13px system-ui';
      ctx.fillText('z', 89, -101);
    }

    ctx.restore();
  }

  function make(source, size = 'brand') {
    if (source?.classList?.contains('aero-cgi')) return source;
    const wrap = document.createElement('span');
    wrap.className = 'aero-cgi';
    wrap.dataset.size = source?.dataset.aeroSize || size;
    wrap.dataset.state = source?.dataset.aeroState || activeState;
    wrap.dataset.visible = 'true';
    wrap.tabIndex = source?.tabIndex >= 0 ? source.tabIndex : 0;
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', source?.getAttribute?.('aria-label') || source?.alt || 'Open Aero Discovery Agent');
    wrap.innerHTML = '<canvas aria-hidden="true" width="246" height="282"></canvas>';
    source?.replaceWith(wrap);
    instances.add(wrap);
    visibilityObserver.observe(wrap);
    wrap.addEventListener('click', () => window.AeroAgent?.open?.());
    wrap.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.AeroAgent?.open?.();
      }
    });
    drawAvatar(wrap, performance.now());
    return wrap;
  }

  function upgrade() {
    document.querySelectorAll('img.brand-avatar,img.wizard-avatar,img.landing-skunkie,img[data-aero-agent],.aero-placeholder[data-aero-agent]').forEach(node => {
      if (node.dataset.aeroUpgraded) return;
      node.dataset.aeroUpgraded = '1';
      const inferred = node.classList.contains('landing-skunkie') ? 'hero' : node.classList.contains('wizard-avatar') ? 'wizard' : 'brand';
      make(node, node.dataset.aeroSize || inferred);
    });
  }

  function setState(state = 'idle') {
    activeState = STATES.has(state) ? state : 'idle';
    instances.forEach(instance => {
      instance.dataset.state = activeState;
      drawAvatar(instance, performance.now());
    });
  }

  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    if (!prefersReducedMotion() && delta >= 0) {
      instances.forEach(instance => drawAvatar(instance, now));
    }
    animationFrame = requestAnimationFrame(loop);
  }

  function applyPointer() {
    raf = 0;
    if (matchMedia('(pointer:coarse)').matches || prefersReducedMotion()) return;
    instances.forEach(instance => {
      if (instance.dataset.visible === 'false') return;
      const r = instance.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
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
    entry.target.dataset.visible = String(entry.isIntersecting);
    if (entry.isIntersecting) drawAvatar(entry.target, performance.now());
  }), { rootMargin: '160px' });

  document.addEventListener('pointermove', event => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!raf) raf = requestAnimationFrame(applyPointer);
  }, { passive: true });

  window.addEventListener('resize', () => instances.forEach(instance => drawAvatar(instance, performance.now())), { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) instances.forEach(instance => drawAvatar(instance, performance.now()));
  });

  const observer = new MutationObserver(upgrade);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.AeroCGI = {
    ready: Promise.resolve(),
    upgrade,
    create: make,
    setState,
    frames: [...STATES],
    renderer: 'procedural-canvas-mvp'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgrade, { once: true });
  } else {
    upgrade();
  }
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(loop);
})();