# HRGen DigiTech — AI Growth Studio v3, 13 Nov 2026

**Scope:** The existing HRGen Client Operations v2.1 and GIA Express application, not a second client platform.

## Added: owner-only real AI marketing workflow

1. SEO/GEO pack: local landing introduction, title, meta description and factual FAQs.
2. Social media: two social posts, captions/hashtags and a short reel storyboard.
3. WhatsApp: opt-in business introduction and follow-up **drafts** (no messages sent).
4. Owner can mark drafts approved or discarded; no auto-publication, external contact or payment.
5. CRM follow-up queue based on existing lead stages, explicitly **rule-based not AI** and never transmitted to the LLM.
6. Output, model/version, request timestamps and input/output token counts stored separately in each client SQLite file. Fixed 10 generation attempts/day per client (UTC). Actual provider account charges/limits are independent and must be checked.
7. Form requires only fixed language/style options. Prompt is constructed from public business identity and active service *names*. Patient, appointment, laboratory results and CRM records are not passed to the provider.

## Operational safety

- Enabling requires BOTH a server-side GEMINI_API_KEY and `HRGEN_AI_STUDIO_ENABLED=true`. Leave flag absent/false for no AI traffic. No key appears in frontend or URL.
- To use a paid tier with appropriate privacy terms, configure your Gemini provider account separately. Do not send medical/personal data to free-tier APIs.
- Provider unavailable/429/timeout => HTTP 503 error, request recorded as failed (counts toward daily cap), **not a simulated success**.
- Owner or founder on a selected tenant only; staff unauthorized; cross-tenant requests blocked by existing core auth.
- All outputs are **human-reviewed drafts**, never claimed verified, clinical or published.
- The AI generated content may still hallucinate; the client owner must fact check regulatory/medical and SEO claims.
- These changes do not implement an AI phone agent, AI clinical decision support, payment, report summarization, or an intelligent patient chatbot.

## Integration into the existing server.ts

Keep existing imports, and add:

```ts
import { makeGeminiGenerator } from './src/server/aiStudio.mjs';
```

Inside the existing `if (process.env.HRGEN_CORE_DB_DIR) { ... }` block before `mountTenantRoutes`:

```ts
const aiEnabled = process.env.HRGEN_AI_STUDIO_ENABLED === 'true' && Boolean(process.env.GEMINI_API_KEY);
const generateAi = aiEnabled ? makeGeminiGenerator({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.HRGEN_AI_MODEL || 'gemini-2.5-flash',
}) : null;
```

Pass `{..., aiEnabled, generateAi}` to `mountTenantRoutes`. A concrete patch is committed on the existing feature branch. Keep existing production legacy `/api` safety guard intact.

## New endpoints (all owner/founder authenticated)

| Endpoint | Use |
|---|---|
| GET `/api/v1/workspace/ai/status` | Configuration, quota, recorded tokens |
| POST `/api/v1/workspace/ai/generate` | `{kind:seo_pack|social_post|whatsapp_template,brief:allowed-enum}` |
| GET `/api/v1/workspace/ai/drafts` | Own client's drafts |
| PATCH `/api/v1/workspace/ai/drafts/:id` | `{status:'approved'|'discarded'}` |
| GET `/api/v1/workspace/followups` | Rule-based lead follow-up queue; no model call |

## Verification requirements

- Node 22+ local tests cover isolation, allowed-input only, provider failure, quota, token records, approval and UI-script parse.
- GitHub CI runs the existing app typecheck/build and HTTP Express tests using a provider stub. Actual Gemini API call requires a configured key and opt-in; **not executed in CI**.
- Before hosting: private staging with persistent volume, privacy terms, production secrets, provider data-processing review, two-tenant negative tests, browser/mobile QA, retention/backup restore, monitoring and approval.

## Follow-on modules (not implemented here)

- Tenant-specific public-service FAQ assistant with approved knowledge base and strict retrieval, no PII.
- AI quotation drafting from approved services and prices, approval workflow and signed terms.
- Private document ingestion/RAG with strict tenant ACL, consent and regulated-data provider controls.
- Voice receptionist after TRAI/DoT telephony consent, verified outbound provider and call recording policies.
- Quality-controlled medical report explanation only after clinical governance; never diagnosis or automated report interpretation by default.
