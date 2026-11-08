# HRGen Workflow Twin — controlled build and release register

**Control status:** DRAFT / NOT DEPLOYED. This folder layout describes the actual files in this feature branch. No clinical, marketing, billing, messaging, external-call or production activation is authorized.

## Single-owner worktree

```
public/brand/
  hrgen-wordmark-original-crop.webp  # cropped from user Library asset, not a new logo
src/
  components/
    HRGenWordmark.tsx                  # one shared brand asset component
    WorkflowTwinView.tsx              # customer / admin UI and mobile Build / Flow / Review
    WorkflowTwinView.css              # isolated black-magenta-white design system
    WorkflowPitchKit.tsx              # optional admin-only quotation/message draft
    Header.tsx                        # top brand/navigation only
  utils/
    workflowTwin.ts                   # canonical modules, dependencies, recommendations, validations
tests/
  workflowTwin.test.ts                # graph rules
  workflowTwinBrand.test.ts           # logo/UX/security boundary
.github/workflows/
  workflow-twin-checks.yml           # automated static tests, type check, production build
```

## Data and ownership boundaries

- **HRGen source and brand:** controlled by HRGen. Reuse the original approved asset; do not generate replacement logos or apply gradient backgrounds to it.
- **Customer/third-party evidence:** recordings, testimonials, videos and demo links are externally owned until separately evidenced and authorized for sharing. Empty link fields are intentionally empty. URL syntax checking is not verification of content, rights, or consent.
- **Pitch and pricing:** example setup ₹30,000 is proposed, not an agreed price or market-lowest claim. No Stripe, Razorpay, n8n, WhatsApp or other external provider is activated by the prototype.
- **Privacy:** no patient identities, reports, test results, credentials or consent documents may be placed in the sales draft or source repository. WhatsApp opens only after direct human action.
- **Repo identity:** the connected GitHub Command Center repository is not the historical `hrgen-ai-workforce` ZIP containing `server/agents/registry.js`. No CEO/PM code is modified here.

## Acceptance checklist

| Control | Pass evidence | Status |
|---|---|---|
| Original logo reused | Repository logo asset + shared component | SOURCE COMMITTED |
| Color isolation | Black, magenta, white; no purple accents in the Workflow Twin | SOURCE COMMITTED |
| Mobile usability | 3 native tabs, vertical flow, 44px+ taps, pressed halo | SOURCE COMMITTED |
| Reduced-motion support | CSS media query | SOURCE COMMITTED |
| React regression | GitHub Actions result for current commit | RECHECK ON LATEST SHA |
| UI browser walkthrough | Captured mobile screenshots, tap/navigation, screen-reader tests | NEEDS REAL BROWSER |
| Backend auth / tenant isolation | Independent negative-permission tests | NOT IN THIS PROTOTYPE |
| Current workforce registry | Current source SHA, 12-agent count, duplicate keys, CEO/PM permissions | UNVERIFIED IN THIS REPO |
| Lead kit sales artifacts | Source and sharing consent for every demo, recording, video and testimonial | NO VERIFIED ASSETS PROVIDED |
| Pricing acceptance | Source date, scope, tax terms, owner approval | PROPOSAL ONLY |
| Production / public claims | Hosted QA and sign-off | NOT AUTHORIZED |

## Release sequence

Source commit → CI tests + type-check + build → mobile browser QA → owner review → independent security and integration gates → approved staging → separate live deployment approval.

**No automatic publish, merge, payment enablement or WhatsApp send.** 
