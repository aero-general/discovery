(() => {
  'use strict';

  const STORAGE_KEY = 'skunkieAssistantChatV1';
  const SESSION_KEY = 'skunkieSessionId';
  const QUICK_PROMPTS = ['Explain this question','Summarise my progress','What should the pilot include?','What are the main risks?','What happens next?'];
  const state = { open: false, unread: 0, busy: false, idleTimer: null, webhookUrl: '' };
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const getSessionId = () => {
    let value = sessionStorage.getItem(SESSION_KEY);
    if (!value) { value = crypto.randomUUID ? crypto.randomUUID() : `sk-${Date.now()}-${Math.random().toString(16).slice(2)}`; sessionStorage.setItem(SESSION_KEY, value); }
    return value;
  };
  const loadMessages = () => {
    try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(data) ? data.slice(-80) : []; }
    catch (_) { localStorage.removeItem(STORAGE_KEY); return []; }
  };
  const messages = loadMessages();
  const saveMessages = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-80))); } catch (_) {} };

  function setMood(mood, duration = 1200) {
    document.querySelectorAll('.brand-avatar,.wizard-avatar,.skunkie-launcher img,.skunkie-chat-head img').forEach(image => {
      image.classList.add('skunkie-motion');
      image.dataset.mood = mood;
    });
    clearTimeout(setMood.timer);
    if (mood !== 'thinking' && mood !== 'sleeping') setMood.timer = setTimeout(() => setMood('idle', 0), duration);
  }

  function buildUi() {
    const launcher = document.createElement('button');
    launcher.className = 'skunkie-launcher';
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Chat with Skunkie');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = '<span class="pulse"></span><img src="assets/skunkie.svg" alt=""><span class="skunkie-badge" aria-label="Unread messages">0</span>';

    const panel = document.createElement('section');
    panel.className = 'skunkie-chat';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with Skunkie');
    panel.innerHTML = `
      <header class="skunkie-chat-head">
        <img src="assets/skunkie.svg" alt="">
        <div><div class="skunkie-chat-title">Chat with Skunkie</div><div class="skunkie-chat-status">interactive discovery guide</div></div>
        <button class="skunkie-chat-close" type="button" aria-label="Close Skunkie chat">Close</button>
      </header>
      <div class="skunkie-chat-log" aria-live="polite"></div>
      <div class="skunkie-chat-typing">Skunkie is thinking…</div>
      <div class="skunkie-chat-prompts"></div>
      <form class="skunkie-chat-form"><input type="text" maxlength="700" autocomplete="off" placeholder="Ask Skunkie about the assessment…" aria-label="Message Skunkie"><button type="submit" aria-label="Send message">➤</button></form>`;

    document.body.append(panel, launcher);
    QUICK_PROMPTS.forEach(prompt => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = prompt;
      button.addEventListener('click', () => submitMessage(prompt));
      panel.querySelector('.skunkie-chat-prompts').appendChild(button);
    });
    launcher.addEventListener('click', togglePanel);
    panel.querySelector('.skunkie-chat-close').addEventListener('click', () => togglePanel(false));
    panel.querySelector('form').addEventListener('submit', event => { event.preventDefault(); const input = panel.querySelector('input'); const value = input.value.trim(); if (value) { input.value = ''; submitMessage(value); } });

    if (!messages.length) messages.push({ role:'bot', text:'Hello. I’m Skunkie. I can explain the current question, summarise your assessment, discuss risks and pilot scope, or help you decide what happens next.', time:now(), intent:'greeting' });
    renderMessages();
    return { launcher, panel };
  }

  let ui;
  function renderMessages() {
    if (!ui) return;
    const log = ui.panel.querySelector('.skunkie-chat-log');
    log.innerHTML = messages.map(message => `<div class="skunkie-chat-message ${message.role === 'user' ? 'user' : 'bot'}">${escapeHtml(message.text)}<span class="skunkie-chat-meta">${escapeHtml(message.time || '')}${message.intent ? ` · ${escapeHtml(message.intent)}` : ''}</span></div>`).join('');
    log.scrollTop = log.scrollHeight;
    saveMessages();
  }

  function togglePanel(force) {
    state.open = typeof force === 'boolean' ? force : !state.open;
    ui.panel.classList.toggle('open', state.open);
    ui.launcher.setAttribute('aria-expanded', String(state.open));
    if (state.open) { state.unread = 0; updateBadge(); setMood('happy'); setTimeout(() => ui.panel.querySelector('input').focus(), 60); }
  }

  function updateBadge() {
    const badge = ui.launcher.querySelector('.skunkie-badge');
    badge.textContent = String(state.unread);
    badge.classList.toggle('visible', state.unread > 0);
  }

  function contextSnapshot() {
    const data = typeof responses === 'object' && responses ? responses : {};
    const question = typeof activeQuestions === 'function' ? activeQuestions()[typeof current === 'number' ? current : 0] : null;
    return {
      page: location.pathname,
      title: document.title,
      assessment: data,
      currentQuestion: question ? { key: question.key, title: question.title, stage: question.stage, why: question.why } : null,
      progress: typeof activeQuestions === 'function' ? { index: (typeof current === 'number' ? current : 0) + 1, total: activeQuestions().length } : null,
      theme: document.documentElement.dataset.theme || 'light'
    };
  }

  async function callWebhook(message, localResult) {
    if (!state.webhookUrl) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(state.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'X-Skunkie-Client':'discovery-portal/1.0' },
        body: JSON.stringify({ event:'chat.message', sessionId:getSessionId(), message, localIntent:localResult.intent, localConfidence:localResult.confidence, context:contextSnapshot(), sentAt:new Date().toISOString() }),
        signal: controller.signal,
        credentials: 'omit'
      });
      if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
      const data = await response.json();
      return typeof data.reply === 'string' && data.reply.trim() ? { text:data.reply.trim(), intent:data.intent || localResult.intent } : null;
    } catch (error) {
      console.warn('Skunkie webhook unavailable; using local intent response.', error);
      return null;
    } finally { clearTimeout(timeout); }
  }

  async function submitMessage(text) {
    if (state.busy) return;
    state.busy = true;
    messages.push({ role:'user', text, time:now() });
    renderMessages();
    setMood('thinking');
    ui.panel.querySelector('.skunkie-chat-typing').classList.add('visible');

    const localResult = window.SkunkieIntents?.respond(text) || { intent:'fallback', confidence:0.2, text:'I can help with the assessment, pilot scope, risk, budget, technology, and next steps.' };
    const webhookResult = await callWebhook(text, localResult);
    await new Promise(resolve => setTimeout(resolve, webhookResult ? 180 : 420));
    const result = webhookResult || localResult;
    messages.push({ role:'bot', text:result.text, time:now(), intent:result.intent });
    renderMessages();
    ui.panel.querySelector('.skunkie-chat-typing').classList.remove('visible');
    setMood(result.intent === 'risk' ? 'alert' : 'happy');
    if (!state.open) { state.unread += 1; updateBadge(); }
    state.busy = false;
    document.dispatchEvent(new CustomEvent('skunkie:response', { detail: { input:text, ...result } }));
  }

  function configureWebhook() {
    const meta = document.querySelector('meta[name="skunkie-webhook"]');
    const candidate = meta?.content || document.documentElement.dataset.skunkieWebhook || '';
    try {
      if (candidate) {
        const url = new URL(candidate, location.href);
        if (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) state.webhookUrl = url.href;
      }
    } catch (_) { console.warn('Ignoring invalid Skunkie webhook URL.'); }
  }

  function bindPageReactions() {
    document.querySelectorAll('.brand-avatar,.wizard-avatar').forEach(image => {
      image.classList.add('skunkie-motion'); image.dataset.mood = 'idle';
      image.addEventListener('mouseenter', () => setMood('curious'));
      image.addEventListener('click', () => { setMood('happy'); togglePanel(true); });
    });
    document.addEventListener('change', event => { if (event.target.matches('input,textarea')) setMood('happy'); });
    document.getElementById('next')?.addEventListener('click', () => setMood('happy'));
    document.getElementById('back')?.addEventListener('click', () => setMood('curious'));
    document.getElementById('whyToggle')?.addEventListener('click', () => setMood('thinking'));
    window.addEventListener('error', () => setMood('alert'));
    ['mousemove','keydown','touchstart','scroll'].forEach(name => document.addEventListener(name, resetIdle, { passive:true }));
    resetIdle();
  }

  function resetIdle() {
    clearTimeout(state.idleTimer);
    if (!state.busy) setMood('idle', 0);
    state.idleTimer = setTimeout(() => { if (!state.open && !state.busy) setMood('sleeping', 0); }, 30000);
  }

  function installFavicon() {
    if (!document.querySelector('link[rel~="icon"]')) {
      const icon = document.createElement('link'); icon.rel = 'icon'; icon.type = 'image/svg+xml'; icon.href = 'assets/favicon.svg'; document.head.appendChild(icon);
    }
  }

  function init() {
    installFavicon(); configureWebhook(); ui = buildUi(); bindPageReactions();
    window.SkunkieAssistant = { open:() => togglePanel(true), close:() => togglePanel(false), send:submitMessage, setMood, getContext:contextSnapshot, getWebhook:() => state.webhookUrl };
    document.dispatchEvent(new CustomEvent('skunkie:ready', { detail:{ intents:window.SkunkieIntents?.names || [], webhookEnabled:Boolean(state.webhookUrl) } }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
