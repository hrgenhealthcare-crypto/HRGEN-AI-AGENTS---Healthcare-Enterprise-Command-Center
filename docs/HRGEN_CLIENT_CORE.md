# HRGen DigiTech — Reusable Real Client Core v1.0

**Status:** implemented and tested local backend module; **not deployed to a public production server**. This is real persistent CRUD, not a demo dataset. It is designed to be mounted into the existing HRGEN-AI-AGENTS Express server, not launched as a competing platform.

## Features

- Password-protected founder/owner/staff accounts. Bootstrap credentials are required, never hardcoded.
- Persistent SQLite storage using Node 22.13+ built-in `node:sqlite`; one platform registry and a physically separate SQLite file per client (UUID filenames), WAL mode.
- New client onboarding from `/workspace`; unique client slug, owner credentials, branding (name, HTTPS logo, accent, contact, tagline).
- Real service catalogue and enable/disable, public `/book/:slug` booking form with explicit consent, booking history/status, internal CRM lead pipeline, audit log.
- Scope-enforced access controls, prepared SQL statements, hashed bearer sessions with 12-hour expiry, scrypt password hashes, password-change endpoint and session revocation, login/booking rate limits.
- No seeded clinical, customer, billing, calling, payment, AI or campaign activity. Does not claim medical-report, LIS, clinical, WhatsApp, AI voice or payment functionality.

## Runtime and persistence

Required: Node **22.13+**, npm dependencies already used by the existing Express + Vite app, and a **persistent writable volume**. Built-in SQLite remains experimental in Node 22; this version is intended for a single Node process and should not be deployed behind multiple replicas or on ephemeral storage.

```bash
export HRGEN_CORE_DB_DIR=/var/lib/hrgen/client-core
export HRGEN_BOOTSTRAP_EMAIL=founder@example.com
export HRGEN_BOOTSTRAP_PASSWORD='use-a-long-unique-password-at-least-12-characters'
export NODE_ENV=production
npm ci
npm run build
npm start
```

**Do not commit secrets or actual patient data.** After initial admin creation, remove `HRGEN_BOOTSTRAP_PASSWORD` and `HRGEN_BOOTSTRAP_EMAIL` from the runtime environment. Change the password through `POST /api/v1/auth/password` after signing in. The original old API endpoints are blocked in production when integration patch is applied. If the core storage env is not configured, no new routes are available and the production legacy APIs still fail closed.

Open `/workspace`, sign in as founder, create a client and owner, select the client, add approved services, save branding. Public booking page is `/book/{slug}`. The client owner can use the same `/workspace` with restricted access.

## Key HTTP endpoints

| Path | Method | Access |
|---|---|---|
| `/api/v1/health` | GET | Public (no secrets) |
| `/api/v1/auth/login`, `/logout`, `/me`, `/password` | POST/GET | Login or bearer |
| `/api/v1/platform/tenants` | GET/POST | Founder only |
| `/api/v1/platform/users` | POST | Founder/owner constrained |
| `/api/v1/workspace/config` | GET/PATCH | Tenant / owner edit |
| `/api/v1/workspace/services` | GET/POST | Tenant / owner create |
| `/api/v1/workspace/bookings` | GET | Tenant staff/owner |
| `/api/v1/workspace/bookings/:id` | PATCH | Tenant staff/owner |
| `/api/v1/workspace/leads` | GET/POST | Tenant staff/owner |
| `/api/v1/workspace/leads/:id` | PATCH | Tenant staff/owner |
| `/api/v1/workspace/audit` | GET | Tenant staff/owner |
| `/api/v1/public/:slug` | GET | Public branding |
| `/api/v1/public/:slug/services` | GET | Public catalogue |
| `/api/v1/public/:slug/bookings` | POST | Public consented booking |

A founder user must pass `?tenantId=<client UUID>` to workspace routes; owner/staff users are bound to their own client. Staff cannot create services, alter branding or create owner accounts.

## Tests

```bash
node --test tests/tenantCore.test.mjs
```

Tests use ephemeral temporary databases, synthetic names and phone numbers. Covers independent tenants, cross-client denials, booking consent, roles, branding, service/call stages, logout, input checks, database reopen persistence and password rotation.

## Release requirements before taking real customer data

1. Deploy in an isolated environment with TLS, working persistent volume, restricted database file permissions and database backup **plus tested restore**.
2. Confirm secret management, production `NODE_ENV`, old legacy `/api` access returns 410, health response, working client console and real browser tests (desktop and iPhone/Android).
3. Exercise two-client negative tests against **hosted HTTP and database**, not just local tests. Verify staff/owner/super-admin roles and session expiry.
4. Publish reviewed privacy/consent/retention policy, adjust booking form to link to that policy, and establish deletion/export process. No medical reports, prescriptions, diagnoses or clinical decisions are supported.
5. Verify payment gateway, webhook signatures and reconciliation **before** representing subscription billing as functional. Current build intentionally does not charge clients.
6. Review threat model (CSRF for any future cookie auth, proxy IP rate limits, persistent storage backup, logging, monitoring, dependency scanning), and obtain release sign-off. SQLite is not a shared multi-region DB.

## In scope / out of scope

In: functional multi-client service booking and CRM foundation, reusable identity and role control, persistent records. Out: full LIMS, clinical reports, payments, outbound telecom, verified DPDP/NABL certification, production hosting, paid subscription entitlements, custom DNS, AI inference. Add these as vetted integrations rather than falsely marking them live.
