(() => {
  'use strict';
  let knowledge={topics:[]};
  const tokenize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(token=>token.length>1);
  const responseData=()=>typeof responses==='object'&&responses?responses:{};
  const list=value=>Array.isArray(value)?value:[];
  const ready=fetch('knowledge/aero-knowledge.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(new Error(String(r.status)))).then(data=>{knowledge=data;return data}).catch(error=>{console.warn('Aero knowledge store unavailable.',error);return knowledge});
  const intentDefs=[
    ['greeting',['hello','hi','hey','good morning','good afternoon','good evening']],
    ['help',['help','what can you do','commands','capabilities','intents','extent']],
    ['why-question',['why ask','why are you asking','explain this question','why this question']],
    ['progress',['progress','how far','remaining','left to do']],
    ['summary',['summary','summarise','summarize','assessment overview']],
    ['data-governance',['data governance','authoritative source','source of truth','data owner','data ownership','data quality','data dictionary','master data']],
    ['entity-model',['entity relationship','data model','property unit tenant lease payment','entity model','relationships']],
    ['reporting-layer',['reporting layer','semantic model','power bi model','metric definition','kpi definition','dashboard model']],
    ['current-workflow',['current state','as-is workflow','existing process','current workflow']],
    ['future-workflow',['future state','to-be workflow','target workflow','future workflow']],
    ['service-design',['service design','handoff','hand-off','decision point','exception path','service level','sla','control point']],
    ['stakeholders',['stakeholder','owner portal','tenant portal','contractor portal','estate agent','building manager','executive']],
    ['integration-baseline',['accounting','property management','crm','bi','cloud storage','spreadsheet','listing platform','digital payment','existing tools']],
    ['operating-model',['operating model','target operating model','proptech platform','integrated service','scalable service']],
    ['pilot',['pilot','mvp','first phase','scope']],
    ['project-data-baseline',['project 1','property operations data baseline','governed dataset','reconciliation results']],
    ['project-dashboard',['project 2','executive performance dashboard','occupancy dashboard','arrears dashboard','portfolio performance']],
    ['project-automation',['project 3','workflow automation','maintenance triage','rental reminder','document approval','viewing request']],
    ['project-operating-model',['project 4','proptech pilot operating model','service catalogue','integration map','raci']],
    ['project-ai-poc',['project 5','ai-assisted operations','ai proof of concept','tenant enquiries','document classification','management reporting']],
    ['automation-governance',['automation control','approval control','human in the loop','exception handling','audit evidence','low risk workflow']],
    ['ai-governance',['approved data only','data boundary','prompt test','response test','human approval','ai risk assessment','governed assistant']],
    ['metrics',['occupancy','collections','arrears','vacancy days','maintenance cost','response time','portfolio performance','kpi']],
    ['change-management',['change management','decision log','decision record','communications','adoption','accountable owner']],
    ['evidence',['process map','dashboard screenshot','prototype','outcome report','sanitized','portfolio evidence','audit evidence']],
    ['skills',['process mapping','data literacy','cloud concepts','security basics','power query','excel controls','power bi','connectors']],
    ['commercial-model',['revenue model','commercial model','subscription','commission','managed service','business case','cost assumption']],
    ['risk',['risk','governance','security','control','audit','risk register']],
    ['privacy',['popia','privacy','consent','personal data','classification','retention']],
    ['budget',['budget','price','cost','commercial','saas','r75','r150']],
    ['architecture',['architecture','azure','api','integration','systems','data']],
    ['whatsapp',['whatsapp','meta','messaging','webhook']],
    ['repository',['repository','github','deployment','pages']],
    ['accessibility',['mobile','desktop','responsive','accessibility','wcag']],
    ['avatar',['avatar','cgi','3d','webgl','animation','mouse','pointer','reactive']],
    ['human',['human','consultant','person','call me','contact me','escalate']],
    ['restart',['restart','start over','clear assessment']],
    ['next-step',['next','what now','after this','roadmap']]
  ];
  const classify=message=>{const text=String(message||'').toLowerCase();let best={intent:'fallback',score:0};for(const [intent,phrases] of intentDefs){let score=0;for(const phrase of phrases)if(text.includes(phrase))score+=phrase.includes(' ')?5:2;if(score>best.score)best={intent,score}}return{intent:best.intent,confidence:best.score?Math.min(.98,.54+best.score*.065):.28}};
  const search=query=>{const tokens=new Set(tokenize(query));return knowledge.topics.map(topic=>{let score=0;for(const key of topic.keywords||[]){const keyText=String(key).toLowerCase();if(String(query).toLowerCase().includes(keyText))score+=6;for(const token of tokenize(keyText))if(tokens.has(token))score+=2}for(const token of tokenize(`${topic.title} ${topic.summary} ${(topic.details||[]).join(' ')}`))if(tokens.has(token))score+=1;return{...topic,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4)};
  const contextual=intent=>{
    const r=responseData(),question=typeof activeQuestions==='function'?activeQuestions()[typeof current==='number'?current:0]:null;
    const priorities=list(r.priorities),risks=list(r.risks),pains=list(r.pains);
    const responses={
      greeting:'Hello. I’m Aero, the property transformation discovery agent. I can help with data governance, workflows, dashboards, automation, operating models, risk, commercial design and the five proposed pilot projects.',
      help:'Ask about the current question, data sources, entity relationships, source-of-truth ownership, process maps, KPIs, stakeholder interfaces, service levels, automation controls, the five projects, architecture, budget, risks or next steps.',
      'why-question':question?.why||'This answer links operating reality to scope, data, controls, stakeholder impact, delivery risk and commercial feasibility.',
      progress:(()=>{const qs=typeof activeQuestions==='function'?activeQuestions():[];return qs.length?`You are on question ${Math.min((typeof current==='number'?current:0)+1,qs.length)} of ${qs.length}. Responses remain editable before submission.`:'The assessment begins after the product overview.'})(),
      summary:`${r.company||'The organisation'} is prioritising ${pains.slice(0,3).join(', ')||'property operating outcomes still being captured'}. The emerging scope includes ${priorities.slice(0,4).join(', ')||'data, workflow, reporting and stakeholder improvements'}, using ${r.deliveryModel||'a hybrid delivery approach'} with a budget of ${r.budget||'not yet confirmed'}.`,
      'data-governance':'Start by defining authoritative systems for properties, units, tenants, leases, payments, maintenance and documents. Assign a business owner and data steward, document validation and reconciliation rules, classify privacy, and publish a controlled data dictionary before automation.',
      'entity-model':'Use stable identifiers and explicit relationships: Property has Units; Unit has Leases over time; Lease links Tenant parties; Payments allocate to Lease obligations; Maintenance cases link Property or Unit, requester, contractor and cost; Documents link to the governed business entity and retention rule.',
      'reporting-layer':'Create a governed semantic reporting layer above reconciled source data. Define every KPI, grain, owner, refresh frequency, access rule and exception treatment. Power Query can stage and validate data; Power BI should consume certified measures rather than independent spreadsheet calculations.',
      'current-workflow':'Document the as-is workflow from trigger to closure, including actors, systems, manual work, decisions, approvals, evidence, hand-offs, elapsed time, failure points and exceptions. Confirm it through stakeholder walkthroughs rather than assumptions.',
      'future-workflow':'Design the to-be workflow only after validating the current state. Preserve required controls, remove duplicate capture, define system boundaries, assign accountable owners, set service levels and include rollback, escalation and exception paths.',
      'service-design':'For each service, define request channels, triage, priority, owner, acknowledgement target, resolution target, approval gates, communications, escalation, closure evidence and exception handling. Measure both elapsed time and customer outcome.',
      stakeholders:'Design role-specific journeys for owners, building managers, tenants, contractors, estate agents and executives. Apply least privilege, show each role only the decisions and evidence they require, and define hand-offs between portals, WhatsApp and human service teams.',
      'integration-baseline':'Accounting, property management, CRM, BI, cloud storage, spreadsheets, listing platforms and digital payments are the practical integration baseline. Improve identifiers, exports, reconciliations and controls first; then introduce connectors and APIs where they reduce measurable risk or effort.',
      'operating-model':'The target is an integrated PropTech operating capability, not isolated automation. Define services, roles, platform ownership, integration accountability, support tiers, vendor governance, data governance, security, reporting, commercial rules and continuous-improvement cadence.',
      pilot:`Keep the pilot bounded and measurable. Prioritise ${priorities.slice(0,5).join(', ')||'a governed data baseline, one dashboard, one low-risk workflow, stakeholder review and controlled reporting'}.`,
      'project-data-baseline':'Project 1 should deliver a governed dataset for properties, units, tenants, leases, payments, arrears, vacancies, maintenance and documents. Acceptance evidence: data dictionary, source map, ownership matrix, quality report, reconciliations and privacy classification.',
      'project-dashboard':'Project 2 should build an executive dashboard for occupancy, collections, arrears, vacancy days, maintenance cost, response time and portfolio performance. Include certified metric definitions, model design, refresh runbook, access model and management interpretation.',
      'project-automation':'Project 3 should automate one low-risk workflow such as maintenance triage, rental reminders, document approval or viewing requests. Include the process map, approval gates, exception path, audit evidence, user test and measured time saving.',
      'project-operating-model':'Project 4 should connect current systems, stakeholder portals, WhatsApp, reporting and governance. Deliver an architecture diagram, RACI, service catalogue, integration map, pilot plan, cost assumptions and risk register.',
      'project-ai-poc':'Project 5 should prototype an assistant for approved tenant enquiries, document classification or management reporting. Constrain it to approved data, define the data boundary, test prompts and responses, require human approval for consequential outputs and document residual risk.',
      'automation-governance':'Automate only after the process, data and control model are stable. Use explicit approval gates, idempotent actions, audit logs, retry limits, exception queues, human override and measurable acceptance criteria.',
      'ai-governance':'A governed assistant must use approved sources only, expose its data boundary, cite or identify supporting records, avoid autonomous consequential decisions, log prompts and outputs, protect personal data and route uncertain or high-risk cases to a human.',
      metrics:'Core measures include occupancy rate, collection rate, arrears value and ageing, vacancy days, maintenance cost per unit, acknowledgement and resolution time, repeat incidents and portfolio yield. Each measure needs a formula, grain, owner and reconciliation control.',
      'change-management':'Create a stakeholder review cadence, decision log, change-impact assessment, communications plan, adoption measures and named accountable owners. Decisions should record context, options, rationale, approver, date, consequences and review trigger.',
      evidence:'Publish sanitized process maps, dashboard views, prototypes, decision records, test evidence and outcome reports. Remove personal, financial and security-sensitive information while retaining enough structure to demonstrate applied capability.',
      skills:'The capability path should cover process mapping, service design, stakeholder analysis, data literacy, Power Query and Excel controls, Power BI modelling, connectors, automation, exception handling, cloud concepts, security basics and transformation governance.',
      'commercial-model':'Tie delivery to business outcomes using a business case, phased roadmap, cost assumptions, service levels and revenue model. Candidate models include subscription per property or unit, managed service fees, transaction or collection fees, listing income, commissions and white-label licensing.',
      risk:`Priority controls should address ${risks.slice(0,5).join(', ')||'POPIA, access control, reconciliation, auditability, vendor responsibility, service continuity and exception ownership'}.`,
      privacy:'Classify property, tenant, lease, payment and document data; apply purpose limitation, minimum necessary access, retention rules, consent or other lawful basis, secure transfer, audit evidence and data-subject procedures.',
      budget:`The selected range is ${r.budget||'not yet confirmed'}. Use fixed-fee discovery, a bounded pilot with acceptance criteria, then a managed-service or SaaS model. Protect budget by improving current tools before commissioning custom development.`,
      architecture:`Current data readiness is ${r.dataReadiness||'not yet confirmed'} and internal capability is ${r.itCapability||'not yet confirmed'}. Reuse existing systems, establish governed identifiers and integration contracts, add a reporting layer, then automate controlled workflows in phases.`,
      whatsapp:'Use WhatsApp as a governed channel, not the system of record. Apply opt-in and template controls, verify webhooks server-side, map conversations to governed entities, support human escalation and retain only required evidence.',
      repository:'The current MVP is a static GitHub Pages application. CI validates assets, JavaScript, knowledge data, accessibility and browser journeys. Production data, identity, AI and integrations require secure server-side services.',
      accessibility:'Maintain keyboard operation, visible focus, semantic labels, sufficient contrast, touch targets, responsive layouts, reduced-motion handling and non-visual status announcements. Test both the assessment and Aero chat at mobile and desktop breakpoints.',
      avatar:'Aero is a reactive Three.js/WebGL assistant with pointer tracking and state-driven gestures. It must remain keyboard accessible, pause off-screen, respect reduced motion and fall back safely where WebGL is unavailable.',
      human:'A production handoff should create a governed service case containing consent, assessment context, requested outcome, priority, owner, due date and relevant conversation evidence.',
      restart:'Use Restart Assessment to clear the current browser draft after confirmation.',
      'next-step':'Validate the assessment with stakeholders, approve authoritative sources and KPI definitions, map current and future workflows, assign owners and controls, then mobilise the five projects through a governed pilot backlog.'
    };
    return responses[intent]||'';
  };
  const respond=message=>{const classified=classify(message),matches=search(message),context=contextual(classified.intent),knowledgeText=matches.map(item=>`${item.title}: ${item.summary}`).join(' '),text=[context,knowledgeText].filter(Boolean).join('\n\n')||'I can help with property data governance, workflows, reporting, stakeholder services, automation, operating models, commercial design and implementation planning.';return{...classified,text,sources:matches.map(item=>item.id)}};
  window.AeroIntents={version:'3.0.0',ready,respond,search,classify,names:intentDefs.map(([name])=>name),get knowledgeCount(){return knowledge.topics.length}};
})();