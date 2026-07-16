(() => {
  'use strict';

  const list = value => Array.isArray(value) ? value : [];
  const responseData = () => (typeof responses === 'object' && responses) ? responses : {};
  const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = value => new Set(normalise(value).split(' ').filter(word => word.length > 2));
  let knowledge = [];

  const builtIn = [
    { name:'greeting', patterns:['hello','hi','hey','good morning','good afternoon','good evening'], response:()=>'Hello. I’m Skunkie, your interactive discovery guide. I can explain questions, search the portal knowledge store, summarise your assessment, discuss architecture, pilot scope, risks, budget, WhatsApp and next steps.' },
    { name:'help', patterns:['help','what can you do','commands','options','capabilities'], response:()=>'Ask me about this portal, the current question, your progress, recommended pilot scope, risks, POPIA, architecture, integrations, WhatsApp, budget, repository implementation, accessibility, or next steps.' },
    { name:'why-question', patterns:['why ask','why are you asking','explain this question','why this question'], response:()=>{ const q=typeof activeQuestions==='function'?activeQuestions()[typeof current==='number'?current:0]:null; return q?.why||'This answer connects a business outcome to scope, architecture, risk, governance or commercial feasibility.'; } },
    { name:'progress', patterns:['progress','how far','remaining','left to do'], response:()=>{ if(typeof activeQuestions!=='function')return 'Your progress is saved locally as you move through the assessment.'; const q=activeQuestions(),p=Math.min((typeof current==='number'?current:0)+1,q.length); return `You are on question ${p} of ${q.length}. You can revisit completed sections and reverse decisions before submission.`; } },
    { name:'summary', patterns:['summary','summarise','summarize','assessment overview'], response:()=>{ const r=responseData(); return `${r.company||'The organisation'} is prioritising ${list(r.pains).slice(0,3).join(', ')||'outcomes still being captured'}. The emerging pilot scope is ${list(r.priorities).slice(0,4).join(', ')||'not yet confirmed'}. The preferred delivery model is ${r.deliveryModel||'still being assessed'}, with a budget of ${r.budget||'not yet confirmed'}.`; } },
    { name:'pilot', patterns:['pilot','first phase','mvp','minimum viable','90 day'], response:()=>{ const r=responseData(); return `Keep the pilot narrow and measurable. Start with ${list(r.priorities).slice(0,5).join(', ')||'a property register, one operational workflow, reporting and a controlled communication channel'}. Prioritise ${list(r.interfaces).slice(0,4).join(', ')||'the smallest interface set needed to prove value'}.`; } },
    { name:'risk', patterns:['risk','security','popia','privacy','compliance','audit','governance'], response:()=>`Priority controls should address ${list(responseData().risks).slice(0,5).join(', ')||'POPIA, access control, payment reconciliation, auditability and service continuity'}. Assign an owner, evidence requirement, escalation path and review cadence to each control.` },
    { name:'budget', patterns:['budget','price','cost','commercial','commercials','saas'], response:()=>`The selected range is ${responseData().budget||'not yet confirmed'}. Use fixed-fee discovery, a bounded pilot with acceptance criteria, and then a managed-service or SaaS operating model.` },
    { name:'technology', patterns:['technology','integration','data','architecture','systems','api','azure'], response:()=>{ const r=responseData(); return `Current data readiness is ${r.dataReadiness||'not yet confirmed'}, and internal capability is ${r.itCapability||'not yet confirmed'}. Reuse existing systems, establish governed identifiers, secure APIs and audit logging, then add automation and AI.`; } },
    { name:'whatsapp', patterns:['whatsapp','message','messaging','chat channel','meta cloud api','bsp'], response:()=>'Production WhatsApp should use Meta WhatsApp Cloud API or an approved BSP, verified webhooks, opt-in evidence, template governance, human escalation, rate controls, audit logging and server-side credential storage.' },
    { name:'repository', patterns:['repository','repo','github','codebase','files','implementation'], response:()=>'This is a static GitHub Pages application. index.html is the entry point; assets contain the adaptive wizard, Skunkie assistant, styles and runtime recovery; knowledge contains the assistant knowledge store; GitHub Actions validates and deploys the complete site.' },
    { name:'accessibility', patterns:['mobile','desktop','responsive','accessibility','keyboard','screen reader','reduced motion'], response:()=>'The experience supports desktop and mobile layouts, system/light/dark themes, keyboard focus, live regions and reduced-motion preferences. On small screens, Skunkie chat becomes a full-height bottom sheet with safe touch targets.' },
    { name:'human', patterns:['human','person','agent','consultant','call me','contact me'], response:()=>'I can prepare a human handoff. A production webhook should create a CRM lead or service ticket containing consent status, contact preference, assessment summary and the relevant conversation transcript.' },
    { name:'restart', patterns:['restart','start over','clear assessment'], response:()=>'Use Restart Assessment to clear the browser draft. The portal requests confirmation before removing saved assessment and chat data.' },
    { name:'next-step', patterns:['next','what now','after this','next step','roadmap'], response:()=>'Validate the assessment with decision-makers, confirm measurable KPIs, identify system and data owners, agree the pilot backlog, map risks to controls, approve the commercial model and schedule implementation kickoff.' }
  ];

  function scoreTopic(query, topic) {
    const q=tokens(query); if(!q.size)return 0;
    const corpus=tokens([topic.title,topic.summary,...list(topic.keywords),...list(topic.details)].join(' '));
    let score=0; q.forEach(token=>{ if(corpus.has(token))score+=2; if(list(topic.keywords).some(k=>normalise(k).includes(token)))score+=2; });
    if(normalise(query).includes(normalise(topic.title)))score+=5;
    return score;
  }

  function retrieve(query) {
    return knowledge.map(topic=>({topic,score:scoreTopic(query,topic)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  }

  function classify(raw) {
    const text=normalise(raw);
    let best={name:'fallback',score:0,response:null};
    builtIn.forEach(intent=>{ let score=0; intent.patterns.forEach(pattern=>{ const p=normalise(pattern); if(text.includes(p))score+=p.split(' ').length+2; }); if(score>best.score)best={...intent,score}; });
    const matches=retrieve(text);
    if(matches[0]&&matches[0].score>best.score)return {name:`knowledge:${matches[0].topic.id}`,score:matches[0].score,matches};
    return {...best,matches};
  }

  function knowledgeResponse(matches) {
    const primary=matches[0].topic;
    const detail=list(primary.details).slice(0,3).join(' ');
    const related=matches.slice(1).map(x=>x.topic.title).join(', ');
    return `${primary.summary}${detail?` ${detail}`:''}${related?` Related knowledge: ${related}.`:''}`;
  }

  async function loadKnowledge() {
    try { const response=await fetch('knowledge/skunkie-knowledge.json',{cache:'no-cache'}); if(!response.ok)throw new Error(String(response.status)); const data=await response.json(); knowledge=list(data.topics); }
    catch(error){ console.warn('Skunkie knowledge store unavailable.',error); knowledge=[]; }
  }

  window.SkunkieIntents={
    version:'2.0.0',
    ready:loadKnowledge(),
    classify,
    search:retrieve,
    respond(message){
      const result=classify(message);
      if(result.name.startsWith('knowledge:'))return {intent:'knowledge',confidence:Math.min(.98,.6+result.score*.04),text:knowledgeResponse(result.matches),sources:result.matches.map(x=>x.topic.id)};
      if(result.response)return {intent:result.name,confidence:Math.min(.96,.7+result.score*.03),text:result.response()};
      const matches=result.matches||[];
      if(matches.length)return {intent:'knowledge',confidence:.62,text:knowledgeResponse(matches),sources:matches.map(x=>x.topic.id)};
      return {intent:'fallback',confidence:.3,text:'I can search the portal knowledge store and help with the assessment, pilot scope, risk, architecture, integrations, WhatsApp, budget, accessibility, repository implementation or next steps.'};
    },
    names:builtIn.map(intent=>intent.name),
    get knowledgeCount(){return knowledge.length;}
  };
})();