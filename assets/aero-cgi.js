(() => {
  'use strict';
  const SPRITE='assets/aero-cgi-sprite.webp';
  const FRAMES={idle:0,wave:1,present:2,thumbs:3,welcome:4,thinking:5,curious:6,excited:7,happy:8,surprised:9,explaining:10,data:11,confident:12,alert:13,concerned:14,success:15,thanks:16,laughing:17,working:18,sleeping:19};
  const SEQUENCES={idle:['idle','curious','idle'],wave:['idle','wave','present','wave'],thinking:['thinking','curious','thinking'],working:['working','data','working'],happy:['happy','success','happy'],alert:['alert','concerned','alert'],sleeping:['sleeping']};
  const image=new Image(); image.decoding='async'; image.fetchPriority='high'; image.src=SPRITE;
  const instances=new Set();
  const dims={cols:5,rows:4,sourceW:1232,sourceH:1277,cropH:282};
  let activeState='idle',pointer={x:innerWidth/2,y:innerHeight/2},raf=0;

  function draw(instance,state){
    if(!instance.isConnected||instance.dataset.visible==='false'||document.hidden)return;
    const index=FRAMES[state]??0,col=index%5,row=Math.floor(index/5),sw=dims.sourceW/dims.cols,sh=dims.sourceH/dims.rows;
    const canvas=instance.querySelector('canvas'),ctx=canvas?.getContext('2d',{alpha:true});
    if(!canvas||!ctx)return;
    const cssWidth=Number(instance.dataset.renderWidth||246),cssHeight=Number(instance.dataset.renderHeight||282);
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    const targetW=Math.round(cssWidth*ratio),targetH=Math.round(cssHeight*ratio);
    if(canvas.width!==targetW||canvas.height!==targetH){canvas.width=targetW;canvas.height=targetH}
    ctx.clearRect(0,0,targetW,targetH);
    ctx.drawImage(image,col*sw,row*sh,sw,dims.cropH,0,0,targetW,targetH);
  }

  function animate(instance){
    clearInterval(instance._aeroTimer);
    const seq=SEQUENCES[instance.dataset.state]||[instance.dataset.state||'idle'];
    let i=0;
    draw(instance,seq[0]);
    if(seq.length>1&&instance.dataset.visible!=='false'&&!document.hidden){
      instance._aeroTimer=setInterval(()=>draw(instance,seq[++i%seq.length]),520);
    }
  }

  function make(source,size='brand'){
    if(source?.classList?.contains('aero-cgi'))return source;
    const wrap=document.createElement('span');
    wrap.className='aero-cgi';
    wrap.dataset.size=source?.dataset.aeroSize||size;
    wrap.dataset.state=source?.dataset.aeroState||activeState;
    wrap.dataset.visible='true';
    wrap.setAttribute('role','img');
    wrap.setAttribute('aria-label',source?.getAttribute?.('aria-label')||source?.alt||'Aero Discovery Agent');
    wrap.innerHTML='<canvas aria-hidden="true" width="246" height="282"></canvas>';
    source?.replaceWith(wrap);
    instances.add(wrap);
    visibilityObserver.observe(wrap);
    if(image.complete&&image.naturalWidth)animate(wrap);else image.addEventListener('load',()=>animate(wrap),{once:true});
    wrap.addEventListener('click',()=>window.AeroAgent?.open?.());
    return wrap;
  }

  function upgrade(){
    document.querySelectorAll('img.brand-avatar,img.wizard-avatar,img.landing-skunkie,img[data-aero-agent],.aero-placeholder[data-aero-agent]').forEach(node=>{
      if(node.dataset.aeroUpgraded)return;
      node.dataset.aeroUpgraded='1';
      make(node,node.dataset.aeroSize||node.classList.contains('landing-skunkie')?'hero':node.classList.contains('wizard-avatar')?'wizard':'brand');
    });
  }

  function setState(state='idle'){
    activeState=FRAMES[state]===undefined?'idle':state;
    instances.forEach(instance=>{instance.dataset.state=activeState;animate(instance)});
  }

  function applyPointer(){
    raf=0;
    if(matchMedia('(pointer:coarse)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    instances.forEach(instance=>{
      if(instance.dataset.visible==='false')return;
      const r=instance.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=(pointer.x-cx)/Math.max(innerWidth,1),dy=(pointer.y-cy)/Math.max(innerHeight,1),p=Math.max(0,1-Math.hypot(pointer.x-cx,pointer.y-cy)/720);
      instance.style.setProperty('--aero-ry',`${Math.max(-14,Math.min(14,dx*34))*p}deg`);
      instance.style.setProperty('--aero-rx',`${Math.max(-11,Math.min(11,-dy*28))*p}deg`);
      instance.style.setProperty('--aero-tx',`${Math.max(-9,Math.min(9,dx*22))*p}px`);
      instance.style.setProperty('--aero-ty',`${Math.max(-7,Math.min(7,dy*18))*p}px`);
    });
  }

  const visibilityObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const instance=entry.target;
    instance.dataset.visible=String(entry.isIntersecting);
    if(entry.isIntersecting)animate(instance);else clearInterval(instance._aeroTimer);
  }),{rootMargin:'160px'});

  document.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};if(!raf)raf=requestAnimationFrame(applyPointer)},{passive:true});
  document.addEventListener('visibilitychange',()=>instances.forEach(instance=>document.hidden?clearInterval(instance._aeroTimer):animate(instance)));
  const observer=new MutationObserver(upgrade); observer.observe(document.documentElement,{childList:true,subtree:true});
  window.AeroCGI={ready:image.decode?.().catch(()=>{})||Promise.resolve(),upgrade,create:make,setState,frames:Object.keys(FRAMES),sprite:SPRITE};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',upgrade,{once:true});else upgrade();
})();