# Skunkie webhook contract

The GitHub Pages client operates safely without a webhook. When a secure backend is available, add this tag to `index.html`:

```html
<meta name="skunkie-webhook" content="https://api.example.com/v1/skunkie/chat">
```

Do not place API keys, Meta WhatsApp tokens, AI credentials, signing secrets, or tenant secrets in the browser.

## Request

`POST /v1/skunkie/chat`

```json
{
  "event": "chat.message",
  "sessionId": "uuid",
  "message": "What should the pilot include?",
  "localIntent": "pilot",
  "localConfidence": 0.86,
  "context": {
    "page": "/discovery/",
    "title": "Property Transformation Discovery Portal",
    "assessment": {},
    "currentQuestion": {
      "key": "priorities",
      "title": "Which capabilities are most important in the first 90 days?",
      "stage": 1,
      "why": "..."
    },
    "progress": { "index": 4, "total": 16 },
    "theme": "dark"
  },
  "sentAt": "2026-07-16T00:00:00.000Z"
}
```

## Response

```json
{
  "reply": "Start with a property register, maintenance workflow and owner dashboard.",
  "intent": "pilot",
  "conversationId": "server-generated-id",
  "handoff": null
}
```

## Supported server-side extensions

- `chat.message`: generate a grounded answer.
- `lead.create`: create a consented CRM lead.
- `handoff.request`: route the transcript to a human consultant.
- `assessment.save`: persist an encrypted assessment draft.
- `appointment.request`: create a scheduling workflow.
- `whatsapp.opt_in`: record WhatsApp consent and policy version.
- `feedback.capture`: store user experience feedback.

## Security controls

1. Allow only the production portal origin through CORS.
2. Validate request size, schema and content type.
3. Rate-limit by session, IP and tenant.
4. Strip or tokenize unnecessary personal data before model calls.
5. Keep provider credentials in a managed secret store.
6. Log request IDs, intent, latency and outcome without logging secrets.
7. Apply prompt-injection controls and ground responses in approved data.
8. Use authenticated human handoff for sensitive or high-impact decisions.
9. Define POPIA retention, deletion and data-subject request procedures.
10. Return generic errors; never expose stack traces or provider responses.

## Client fallback

If the webhook times out, returns a non-2xx response or returns invalid JSON, Skunkie automatically falls back to the local intent engine. This keeps the demonstration functional while preventing browser credentials.
