(() => {
  'use strict';

  const includesAny = (text, words) => words.some(word => text.includes(word));
  const list = value => Array.isArray(value) ? value : [];
  const responseData = () => (typeof responses === 'object' && responses) ? responses : {};

  const intents = [
    { name: 'greeting', patterns: ['hello','hi','hey','good morning','good afternoon','good evening'], response: () => 'Hello. I’m Skunkie, your interactive discovery guide. I can explain questions, summarise your progress, help define a pilot, discuss risks, or suggest the next step.' },
    { name: 'help', patterns: ['help','what can you do','commands','options'], response: () => 'Try asking: “Why are you asking this?”, “Summarise my assessment”, “What should the pilot include?”, “What are the risks?”, “Explain the budget”, or “What happens next?”' },
    { name: 'why-question', patterns: ['why ask','why are you asking','explain this question','why this question'], response: () => {
      if (typeof activeQuestions !== 'function') return 'Each question connects a business decision to scope, architecture, risk, governance, or commercial feasibility.';
      const question = activeQuestions()[typeof current === 'number' ? current : 0];
      return question?.why || 'This answer helps connect business outcomes to a practical implementation recommendation.';
    }},
    { name: 'progress', patterns: ['progress','how far','remaining','left to do'], response: () => {
      if (typeof activeQuestions !== 'function') return 'Your progress is saved as you move through the assessment.';
      const questions = activeQuestions();
      const position = Math.min((typeof current === 'number' ? current : 0) + 1, questions.length);
      return `You are on question ${position} of ${questions.length}. Your answers are saved locally, and you can revisit completed sections before submission.`;
    }},
    { name: 'summary', patterns: ['summary','summarise','summarize','assessment overview'], response: () => {
      const r = responseData();
      const pains = list(r.pains).slice(0,3).join(', ') || 'not yet confirmed';
      const priorities = list(r.priorities).slice(0,4).join(', ') || 'not yet confirmed';
      return `${r.company || 'The organisation'} is prioritising ${pains}. The emerging pilot scope is ${priorities}. The preferred delivery model is ${r.deliveryModel || 'still being assessed'}, with a budget of ${r.budget || 'not yet confirmed'}.`;
    }},
    { name: 'pilot', patterns: ['pilot','first phase','mvp','minimum viable'], response: () => {
      const r = responseData();
      const priorities = list(r.priorities).slice(0,5);
      const interfaces = list(r.interfaces).slice(0,4);
      return `Keep the pilot narrow and measurable. Start with ${priorities.join(', ') || 'a property register, one operational workflow, reporting, and a controlled communication channel'}. Prioritise ${interfaces.join(', ') || 'the smallest set of user interfaces needed to prove the operating model'}.`;
    }},
    { name: 'risk', patterns: ['risk','security','popia','privacy','compliance'], response: () => {
      const risks = list(responseData().risks).slice(0,5);
      return `The priority controls should address ${risks.join(', ') || 'personal-data protection, access control, payment reconciliation, auditability, and service continuity'}. Each control needs an owner, evidence requirement, escalation path, and review cadence.`;
    }},
    { name: 'budget', patterns: ['budget','price','cost','commercial','commercials'], response: () => {
      const r = responseData();
      return `The selected range is ${r.budget || 'not yet confirmed'}. A defensible commercial sequence is fixed-fee discovery, a bounded pilot with acceptance criteria, and then a managed-service or SaaS operating model.`;
    }},
    { name: 'technology', patterns: ['technology','integration','data','architecture','systems'], response: () => {
      const r = responseData();
      return `Current data readiness is ${r.dataReadiness || 'not yet confirmed'}, and internal capability is ${r.itCapability || 'not yet confirmed'}. The architecture should reuse existing systems, establish governed identifiers, secure APIs, audit logging, and only then add advanced automation or AI.`;
    }},
    { name: 'whatsapp', patterns: ['whatsapp','message','messaging','chat channel'], response: () => 'A production WhatsApp channel should use Meta WhatsApp Cloud API or an approved BSP, verified webhooks, opt-in and consent evidence, template governance, human escalation, rate controls, audit logging, and server-side credential storage.' },
    { name: 'next-step', patterns: ['next','what now','after this','next step'], response: () => 'Next: validate the assessment with decision-makers, confirm measurable KPIs, identify system and data owners, agree the pilot backlog, map risks to controls, approve the delivery model, and schedule the implementation kickoff.' },
    { name: 'human', patterns: ['human','person','agent','consultant','call me','contact me'], response: () => 'I can prepare the conversation for a human consultant. In production, this intent should create a CRM lead or service ticket and pass the assessment summary, consent status, preferred contact channel, and conversation transcript.' },
    { name: 'restart', patterns: ['restart','start over','clear assessment'], response: () => 'Use the Restart Assessment button to clear the current browser draft. This action asks for confirmation before removing saved assessment and chat data.' }
  ];

  const classify = raw => {
    const text = String(raw || '').trim().toLowerCase();
    const match = intents.find(intent => includesAny(text, intent.patterns));
    return match || { name: 'fallback', response: () => 'I can help with assessment progress, question rationale, pilot scope, risks, budget, technology, WhatsApp integration, or next steps. Ask a more specific question and I’ll use your saved assessment context.' };
  };

  window.SkunkieIntents = {
    version: '1.0.0',
    classify,
    respond(message) {
      const intent = classify(message);
      return { intent: intent.name, confidence: intent.name === 'fallback' ? 0.35 : 0.86, text: intent.response() };
    },
    names: intents.map(intent => intent.name)
  };
})();
