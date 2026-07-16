import http from 'node:http';

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://aero-general.github.io';
const MAX_BODY_BYTES = 32_768;

function json(res, status, body, requestId) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, X-Skunkie-Client',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Request-Id': requestId
  });
  res.end(JSON.stringify(body));
}

function validate(payload) {
  if (!payload || payload.event !== 'chat.message') return 'Unsupported event.';
  if (typeof payload.sessionId !== 'string' || payload.sessionId.length > 120) return 'Invalid session.';
  if (typeof payload.message !== 'string' || !payload.message.trim() || payload.message.length > 700) return 'Invalid message.';
  if (!payload.context || typeof payload.context !== 'object') return 'Invalid context.';
  return null;
}

function localServerReply(payload) {
  const intent = String(payload.localIntent || 'fallback');
  const company = payload.context?.assessment?.company || 'the organisation';
  const templates = {
    pilot: `For ${company}, keep the pilot narrow, measurable and limited to the highest-value workflows.`,
    risk: 'Convert each selected risk into a named control owner, evidence requirement and escalation path.',
    budget: 'Use fixed-fee discovery, a bounded pilot with acceptance criteria, and then a managed-service or SaaS model.',
    human: 'A human handoff has been identified. Production should create a consented CRM lead or service ticket.',
    fallback: 'I can help with pilot scope, risks, budget, technology, WhatsApp integration and next steps.'
  };
  return { reply: templates[intent] || templates.fallback, intent, conversationId: payload.sessionId, handoff: intent === 'human' ? { requested: true } : null };
}

const server = http.createServer((req, res) => {
  const requestId = crypto.randomUUID();
  if (req.method === 'OPTIONS') return json(res, 204, {}, requestId);
  if (req.method !== 'POST' || req.url !== '/v1/skunkie/chat') return json(res, 404, { error: 'Not found.' }, requestId);

  let body = '';
  let size = 0;
  req.setEncoding('utf8');
  req.on('data', chunk => {
    size += Buffer.byteLength(chunk);
    if (size > MAX_BODY_BYTES) req.destroy(new Error('Body too large'));
    else body += chunk;
  });
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      const error = validate(payload);
      if (error) return json(res, 400, { error }, requestId);
      const result = localServerReply(payload);
      console.log(JSON.stringify({ requestId, event: payload.event, intent: result.intent, sentAt: payload.sentAt }));
      return json(res, 200, result, requestId);
    } catch (error) {
      console.error(JSON.stringify({ requestId, error: error.message }));
      return json(res, 400, { error: 'Invalid request.' }, requestId);
    }
  });
  req.on('error', error => {
    console.error(JSON.stringify({ requestId, error: error.message }));
    if (!res.headersSent) json(res, 413, { error: 'Request rejected.' }, requestId);
  });
});

server.listen(PORT, () => console.log(`Skunkie webhook listening on http://localhost:${PORT}/v1/skunkie/chat`));
