(() => {
  'use strict';

  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
  const STATES = new Set(['idle','wave','present','thumbs','welcome','thinking','curious','excited','happy','surprised','explaining','data','confident','alert','concerned','success','thanks','laughing','working','sleeping']);
  const instances = new Set();
  let THREE = null;
  let activeState = 'idle';
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let animationFrame = 0;
  let lastTime = performance.now();

  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function fallbackCanvas(wrap) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    wrap.appendChild(canvas);
    const draw = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const w = Math.max(48, wrap.clientWidth || 246), h = Math.max(54, wrap.clientHeight || 282);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const c = canvas.getContext('2d'); c.setTransform(ratio,0,0,ratio,0,0); c.clearRect(0,0,w,h);
      const g = c.createRadialGradient(w*.5,h*.4,4,w*.5,h*.45,w*.42); g.addColorStop(0,'#69dcff'); g.addColorStop(1,'rgba(30,100,150,.12)');
      c.fillStyle=g;c.beginPath();c.arc(w*.5,h*.48,Math.min(w,h)*.38,0,Math.PI*2);c.fill();
      c.fillStyle='#eaf8ff';c.beginPath();c.roundRect(w*.2,h*.18,w*.6,h*.36,Math.min(w,h)*.12);c.fill();
      c.fillStyle='#17384f';c.beginPath();c.roundRect(w*.26,h*.25,w*.48,h*.2,Math.min(w,h)*.08);c.fill();
      c.strokeStyle='#91e4ff';c.lineWidth=Math.max(3,w*.025);c.lineCap='round';
      c.beginPath();c.moveTo(w*.38,h*.34);c.lineTo(w*.44,h*.34);c.moveTo(w*.56,h*.34);c.lineTo(w*.62,h*.34);c.stroke();
      c.fillStyle='#24506b';c.beginPath();c.roundRect(w*.28,h*.54,w*.44,h*.3,Math.min(w,h)*.1);c.fill();
    };
    wrap._fallbackDraw = draw; draw();
  }

  function mat(color, metalness=.35, roughness=.28, emissive=0x000000, emissiveIntensity=0) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity });
  }

  function buildRobot(scene) {
    const root = new THREE.Group(); scene.add(root);
    const accent = mat(0x42d3ff,.25,.22,0x0b8fbd,.28);
    const shell = mat(0xeaf8ff,.18,.22);
    const dark = mat(0x17384f,.55,.24);
    const bodyMat = mat(0x28516b,.52,.3);
    const joint = mat(0x6c93aa,.65,.24);

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.72,.72,8,20), bodyMat); body.position.y=-.35; body.scale.z=.72; root.add(body);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(.78,.38,.12), dark); chest.position.set(0,-.28,.64); chest.geometry.translate(0,0,0); root.add(chest);
    const core = new THREE.Mesh(new THREE.TorusGeometry(.16,.045,12,32), accent); core.position.set(0,-.28,.73); root.add(core);

    const head = new THREE.Group(); head.position.y=.85; root.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(.72,32,24), shell); skull.scale.set(1.18,.88,.88); head.add(skull);
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.02,.48,.13), dark); face.position.z=.61; face.geometry.translate(0,0,0); head.add(face);

    const eyes=[];
    [-.25,.25].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),accent);e.position.set(x,.06,.7);head.add(e);eyes.push(e)});
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(.14,.025,8,24,Math.PI),accent); mouth.rotation.z=Math.PI; mouth.position.set(0,-.16,.7); head.add(mouth);
    const antenna = new THREE.Group(); antenna.position.y=.66; head.add(antenna);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.28,10),joint);stem.position.y=.12;antenna.add(stem);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.07,14,10),accent);tip.position.y=.29;antenna.add(tip);

    function arm(side){
      const pivot=new THREE.Group();pivot.position.set(side*.74,.05,0);root.add(pivot);
      const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.44,6,12),bodyMat);upper.position.y=-.25;upper.rotation.z=side*.12;pivot.add(upper);
      const fore=new THREE.Group();fore.position.set(side*.06,-.52,0);pivot.add(fore);
      const limb=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.35,6,12),joint);limb.position.y=-.22;fore.add(limb);
      const hand=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),accent);hand.position.y=-.46;fore.add(hand);
      return {pivot,fore,hand};
    }
    const left=arm(-1), right=arm(1);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(.68,.78,.16,32),dark);base.position.y=-1.18;root.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.72,.035,10,40),accent);ring.rotation.x=Math.PI/2;ring.position.y=-1.08;root.add(ring);
    return {root,head,body,core,eyes,mouth,antenna,left,right,accent,tip,ring};
  }

  function makeScene(wrap) {
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');wrap.appendChild(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(28,1,.1,50);camera.position.set(0,.05,6.2);
    scene.add(new THREE.HemisphereLight(0xcceeff,0x17384f,2.3));
    const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,4,5);scene.add(key);
    const rim=new THREE.DirectionalLight(0x42d3ff,2);rim.position.set(-4,1,-2);scene.add(rim);
    const robot=buildRobot(scene);
    wrap._aero={renderer,scene,camera,robot,canvas,visible:true};
    resizeInstance(wrap);
  }

  function resizeInstance(wrap){
    const a=wrap._aero;if(!a)return;
    const w=Math.max(48,wrap.clientWidth||246),h=Math.max(54,wrap.clientHeight||282);
    a.renderer.setSize(w,h,false);a.camera.aspect=w/h;a.camera.updateProjectionMatrix();
  }

  function profile(state,t){
    const p={accent:0x42d3ff,bob:Math.sin(t*1.9)*.045,tilt:Math.sin(t*.8)*.03,headY:0,eye:1,mouth:1,left:.18,right:-.18,fore:0,spin:0};
    if(['happy','success','excited','thanks','laughing','thumbs'].includes(state)){p.accent=0x58e39b;p.bob=Math.abs(Math.sin(t*3.8))*.12;p.mouth=1.25;}
    if(['thinking','curious'].includes(state)){p.accent=0xb48cff;p.tilt=-.12;p.right=-.75;p.fore=-.55;p.mouth=.55;}
    if(['alert','concerned','surprised'].includes(state)){p.accent=0xff9b62;p.eye=1.3;p.bob=Math.sin(t*15)*.025;p.mouth=state==='surprised'?.35:.7;}
    if(['working','data','explaining','present'].includes(state)){p.right=-.62+Math.sin(t*3)*.12;p.fore=-.25;p.mouth=.75+Math.abs(Math.sin(t*7))*.5;}
    if(['wave','welcome'].includes(state)){p.right=-1.35+Math.sin(t*7)*.3;p.fore=-.8;p.mouth=1.3;}
    if(state==='sleeping'){p.eye=.08;p.tilt=.12;p.bob=Math.sin(t*1.2)*.025;p.accent=0x7d91a8;p.mouth=.4;}
    return p;
  }

  function animateInstance(wrap,now){
    const a=wrap._aero;if(!a||!a.visible||document.hidden)return;
    const t=now/1000,state=wrap.dataset.state||activeState,p=profile(state,t),r=a.robot;
    const rect=wrap.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const px=clamp((pointer.x-cx)/Math.max(innerWidth,1),-.5,.5),py=clamp((pointer.y-cy)/Math.max(innerHeight,1),-.5,.5);
    r.root.position.y=p.bob;r.root.rotation.z=p.tilt;r.root.rotation.y=reducedMotion()?0:px*.75;
    r.head.rotation.x=reducedMotion()?0:-py*.32;r.head.rotation.y=reducedMotion()?0:px*.48;
    r.left.pivot.rotation.z=p.left;r.right.pivot.rotation.z=p.right;r.right.fore.rotation.z=p.fore;
    const blink=(t%4.7)>4.52?.08:p.eye;r.eyes.forEach(e=>e.scale.y=blink);
    r.mouth.scale.set(1,p.mouth,1);r.antenna.rotation.z=Math.sin(t*2.8)*.08;
    const c=new THREE.Color(p.accent);r.accent.color.lerp(c,.18);r.accent.emissive.lerp(c,.18);r.tip.material=r.accent;r.ring.material=r.accent;r.core.material=r.accent;
    r.core.rotation.z+=.012;r.ring.rotation.z+=state==='working'||state==='data'?.025:.006;
    a.renderer.render(a.scene,a.camera);
  }

  function create(source,size='brand'){
    if(source?.classList?.contains('aero-cgi'))return source;
    const wrap=document.createElement('span');wrap.className='aero-cgi';wrap.dataset.size=source?.dataset.aeroSize||size;wrap.dataset.state=source?.dataset.aeroState||activeState;wrap.dataset.visible='true';wrap.tabIndex=0;
    wrap.setAttribute('role','button');wrap.setAttribute('aria-label',source?.getAttribute?.('aria-label')||source?.alt||'Open Aero Discovery Agent');source?.replaceWith(wrap);instances.add(wrap);observer.observe(wrap);
    wrap.addEventListener('click',()=>window.AeroAgent?.open?.());wrap.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.AeroAgent?.open?.()}});
    if(THREE)makeScene(wrap);else fallbackCanvas(wrap);return wrap;
  }

  function upgrade(){
    document.querySelectorAll('img.brand-avatar,img.wizard-avatar,img.landing-skunkie,img[data-aero-agent],.aero-placeholder[data-aero-agent]').forEach(node=>{if(node.dataset.aeroUpgraded)return;node.dataset.aeroUpgraded='1';const inferred=node.classList.contains('landing-skunkie')?'hero':node.classList.contains('wizard-avatar')?'wizard':'brand';create(node,node.dataset.aeroSize||inferred)});
  }

  function setState(state='idle'){activeState=STATES.has(state)?state:'idle';instances.forEach(i=>i.dataset.state=activeState)}
  function loop(now){if(!reducedMotion())instances.forEach(i=>animateInstance(i,now));else instances.forEach(i=>animateInstance(i,0));lastTime=now;animationFrame=requestAnimationFrame(loop)}
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{e.target.dataset.visible=String(e.isIntersecting);if(e.target._aero)e.target._aero.visible=e.isIntersecting}),{rootMargin:'180px'});
  const resizeObserver=new ResizeObserver(entries=>entries.forEach(e=>{resizeInstance(e.target);e.target._fallbackDraw?.()}));
  document.addEventListener('pointermove',e=>pointer={x:e.clientX,y:e.clientY},{passive:true});
  addEventListener('resize',()=>instances.forEach(resizeInstance),{passive:true});

  const ready=import(THREE_URL).then(mod=>{THREE=mod;instances.forEach(wrap=>{wrap.innerHTML='';makeScene(wrap);resizeObserver.observe(wrap)});return true}).catch(error=>{console.warn('Aero 3D engine unavailable; using accessible 2D fallback.',error);instances.forEach(w=>resizeObserver.observe(w));return false});
  window.AeroCGI={ready,upgrade,create,setState,frames:[...STATES],engine:'three-webgl'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{upgrade();instances.forEach(w=>resizeObserver.observe(w))},{once:true});else{upgrade();instances.forEach(w=>resizeObserver.observe(w))}
  animationFrame=requestAnimationFrame(loop);
})();