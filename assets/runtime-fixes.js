(() => {
  'use strict';
  const VERSION='20260716.3';
  const safeRemove=key=>{try{localStorage.removeItem(key)}catch(_){}};
  const pruneInactiveAnswers=()=>{if(typeof activeQuestions!=='function'||typeof responses!=='object')return;const activeKeys=new Set(activeQuestions().map(question=>question.key));['whatsappVolume','maintenanceSla','consent'].forEach(key=>{if(!activeKeys.has(key)&&Object.prototype.hasOwnProperty.call(responses,key))delete responses[key]});if(typeof save==='function')save()};
  const originalNext=document.getElementById('next')?.onclick,next=document.getElementById('next');
  if(next&&typeof originalNext==='function')next.onclick=event=>{if(typeof editReturn!=='undefined'&&editReturn){pruneInactiveAnswers();editReturn=false;if(typeof showReview==='function')showReview();window.scrollTo({top:0,behavior:'smooth'});return}originalNext.call(next,event)};
  document.getElementById('answer')?.addEventListener('change',()=>setTimeout(pruneInactiveAnswers,0));
  const showRuntimeError=message=>{console.error(message);if(document.getElementById('runtimeError'))return;const banner=document.createElement('div');banner.id='runtimeError';banner.setAttribute('role','alert');banner.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;padding:14px 16px;border-radius:12px;background:#7f1d1d;color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.3);font:600 14px/1.4 system-ui';banner.innerHTML='<strong>Aero could not finish loading.</strong> Refresh the page. If the problem continues, clear the site cache or open the page in a private browser window.';document.body.appendChild(banner)};
  window.addEventListener('error',event=>showRuntimeError(event.error||event.message||'Discovery portal runtime error'));
  window.addEventListener('unhandledrejection',event=>showRuntimeError(event.reason||'Discovery portal rejected promise'));
  try{const probe='__discovery_storage_probe__';localStorage.setItem(probe,'1');localStorage.removeItem(probe)}catch(error){console.warn('Local storage is unavailable; save-and-resume is disabled.',error)}
  try{['propDiscoveryAdaptive','discoveryChatV2','aeroAgentChatV1'].forEach(key=>{const raw=localStorage.getItem(key);if(raw)JSON.parse(raw)})}catch(error){console.warn('Invalid saved application state was removed.',error);['propDiscoveryAdaptive','propDiscoveryAdaptiveStep','discoveryChatV2','aeroAgentChatV1'].forEach(safeRemove)}
  const clean=value=>value.split('?')[0];
  const versioned=path=>`${path}?v=${VERSION}`;
  const loadStyle=href=>{if([...document.styleSheets].some(sheet=>sheet.href&&clean(sheet.href).endsWith(clean(href))))return Promise.resolve();return new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=versioned(href);link.onload=resolve;link.onerror=()=>reject(new Error(`Unable to load ${href}`));document.head.appendChild(link)})};
  const loadScript=src=>new Promise((resolve,reject)=>{if([...document.scripts].some(script=>clean(script.src).endsWith(clean(src))))return resolve();const script=document.createElement('script');script.src=versioned(src);script.async=false;script.onload=resolve;script.onerror=()=>reject(new Error(`Unable to load ${src}`));document.body.appendChild(script)});
  Promise.all([loadStyle('assets/aero-cgi.css'),loadStyle('assets/aero-agent.css')])
    .then(()=>loadScript('assets/aero-cgi.js'))
    .then(()=>window.AeroCGI?.ready)
    .then(()=>loadScript('assets/aero-intents.js'))
    .then(()=>window.AeroIntents?.ready)
    .then(()=>loadScript('assets/aero-agent.js'))
    .then(()=>{document.documentElement.dataset.aeroBootstrap='ready';window.AeroCGI?.upgrade?.()})
    .catch(error=>{document.documentElement.dataset.aeroBootstrap='error';showRuntimeError(error)});
})();
