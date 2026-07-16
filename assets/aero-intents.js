(() => {
  'use strict';
  let knowledge={topics:[]};
  const tokenize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(token=>token.length>1);
  const responseData=()=>typeof responses==='object'&&responses?responses:{};
  const list=value=>Array.isArray(value)?value:[];
  const ready=fetch('knowledge/aero-knowledge.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(new Error(String(r.status)))).then(data=>{knowledge=data;return data}).catch(error=>{console.warn('Aero knowledge store unavailable.',error);return knowledge});
  const intentDefs=[
    ['greeting',['hello','hi','hey','good morning','good afternoon','good evening']],
    ['help',['help','what can you do','commands','capabilities']],
    ['why-question',['why ask','why are you asking','explain this question','why this question']],
    ['progress',['progress','how far','remaining','left to do']],
    ['summary',['summary','summarise','summarize','assessment overview']],
    ['pilot',['pilot','mvp','first phase','scope']],
    ['risk',['risk','governance','security','control','audit']],
    ['privacy',['popia','privacy','consent','personal data']],
    ['budget',['budget','price','cost','commercial','saas']],
    ['architecture',['architecture','azure','api','integration','systems','data']],
    ['whatsapp',['whatsapp','meta','messaging','webhook']],
    ['repository',['repository','github','deployment','pages']],
    ['accessibility',['mobile','desktop','responsive','accessibility','wcag']],
    ['avatar',['avatar','cgi','animation','frames','mouse','pointer']],
    ['human',['human','consultant','person','call me','contact me']],
    ['restart',['restart','start over','clear assessment']],
    ['next-step',['next','what now','after this','roadmap']]
  ];
  const classify=message=>{const text=String(message||'').toLowerCase();let best={intent:'fallback',score:0};for(const [intent,phrases] of intentDefs){let score=0;for(const phrase of phrases)if(text.includes(phrase))score+=phrase.includes(' ')?4:2;if(score>best.score)best={intent,score}}return{intent:best.intent,confidence:best.score?Math.min(.96,.56+best.score*.07):.28}};
  const search=query=>{const tokens=new Set(tokenize(query));return knowledge.topics.map(topic=>{let score=0;for(const key of topic.keywords||[]){const keyText=String(key).toLowerCase();if(String(query).toLowerCase().includes(keyText))score+=5;for(const token of tokenize(keyText))if(tokens.has(token))score+=2}for(const token of tokenize(`${topic.title} ${topic.summary}`))if(tokens.has(token))score+=1;return{...topic,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3)};
  const contextual=intent=>{const r=responseData(),question=typeof activeQuestions==='function'?activeQuestions()[typeof current==='number'?current:0]:null;if(intent==='greeting')return 'Hello. I’m Aero, the Aero Discovery Agent. I can explain the current question, interpret your responses, discuss the pilot, architecture, risks, budget and next steps.';if(intent==='help')return 'Ask Aero about the current question, progress, pilot scope, risks, POPIA, architecture, integrations, WhatsApp, budget, the repository, the CGI avatar or next steps.';if(intent==='why-question')return question?.why||'This answer connects business context to scope, architecture, governance, risk or commercial feasibility.';if(intent==='progress'){const qs=typeof activeQuestions==='function'?activeQuestions():[];return qs.length?`You are on question ${Math.min((typeof current==='number'?current:0)+1,qs.length)} of ${qs.length}. Your responses remain editable before submission.`:'The assessment begins after the product overview.'}if(intent==='summary')return `${r.company||'The organisation'} is prioritising ${list(r.pains).slice(0,3).join(', ')||'business outcomes still being captured'}. The emerging pilot includes ${list(r.priorities).slice(0,4).join(', ')||'a focused set of workflows'}, with ${r.deliveryModel||'the delivery model still under review'} and a budget of ${r.budget||'not yet confirmed'}.`;if(intent==='pilot')return `Keep the pilot bounded and measurable. Prioritise ${list(r.priorities).slice(0,5).join(', ')||'a property register, one operational workflow, reporting and a controlled communication channel'}.`;if(intent==='risk'||intent==='privacy')return `Priority controls should address ${list(r.risks).slice(0,5).join(', ')||'POPIA, access control, payment reconciliation, auditability and service continuity'}.`;if(intent==='budget')return `The selected range is ${r.budget||'not yet confirmed'}. Use fixed-fee discovery, a bounded pilot with acceptance criteria, then a managed-service or SaaS model.`;if(intent==='architecture')return `Current data readiness is ${r.dataReadiness||'not yet confirmed'} and internal capability is ${r.itCapability||'not yet confirmed'}. Reuse existing systems, establish governed APIs and identifiers, then add automation in phases.`;if(intent==='human')return 'A production handoff should create a CRM lead or service ticket containing consent, the assessment summary, preferred contact channel and the relevant conversation transcript.';if(intent==='restart')return 'Use Restart Assessment to clear the current browser draft after confirmation.';if(intent==='next-step')return 'Validate the assessment with stakeholders, confirm KPIs and owners, map risks to controls, approve the pilot backlog and mobilise delivery governance.';return''};
  const respond=message=>{const classified=classify(message),matches=search(message),context=contextual(classified.intent),knowledgeText=matches.map(item=>`${item.title}: ${item.summary}`).join(' '),text=[context,knowledgeText].filter(Boolean).join('\n\n')||'I can help with the Aero Discovery assessment, pilot, governance, architecture, commercial model and implementation roadmap.';return{...classified,text,sources:matches.map(item=>item.id)}};
  window.AeroIntents={version:'2.0.0',ready,respond,search,classify,names:intentDefs.map(([name])=>name),get knowledgeCount(){return knowledge.topics.length}};
})();