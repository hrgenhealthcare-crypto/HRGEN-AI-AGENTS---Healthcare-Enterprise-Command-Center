# HRGen Private Supabase Staging — Security Go / No-Go

**Document state:** DRAFT / PRIVATE REVIEW. **Production release: HOLD.**
**Code source:** Draft integration PR #5, not merged into `main`.
**Never treat an isolated PostgreSQL CI result as a hosted Supabase acceptance.**

## Non-negotiable controls

- Obtain a distinct, explicitly approved **private staging** Supabase project.
  No use of existing customer/patient data, production service roles, keys,
  tables, or sign-in identities.
- Store `SUPABASE_SECRET_KEY` only in the trusted application server secret
  manager. **Never** expose it in `VITE_*`, client assets, CI logs, email,
  WhatsApp, repo files, or browser network requests.
- First collect a read-only staging baseline and a verified backup/restore
  checkpoint. Get founder approval *before* any hosted schema mutation.
- All four SQL migrations require DBA/quality review, owner, timestamp and
  a documented recovery plan. The last migration includes grant changes and
  `SECURITY DEFINER`; independently review function owner and `search_path`.
- The `/api/staff` production kill-switch intentionally returns 503. A passing
  staging test does **not** authorize removing it.

## Step 1 — pre-migration evidence (read-only, aggregate only)

Run these SELECT statements only in the approved staging project using a
read-only role. Never return row-level patient details in the approval log.

```sql
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public'
 AND table_name IN ('tenants', 'agent_configs', 'leads_crm',
 'agent_performance_logs', 'prompt_evolution_logs',
 'llm_fallback_audit_logs', 'staff_memberships')
 ORDER BY table_name;
SELECT count(*) AS unscoped_llm_audit
 FROM public.llm_fallback_audit_logs WHERE tenant_id IS NULL;
SELECT count(*) AS cross_tenant_lead_pods FROM public.leads_crm l
 JOIN public.agent_configs a ON l.assigned_pod_id=a.id
 WHERE l.tenant_id IS DISTINCT FROM a.tenant_id;
SELECT count(*) AS cross_tenant_performance_pods FROM public.agent_performance_logs l
 JOIN public.agent_configs a ON l.pod_id=a.id
 WHERE l.tenant_id IS DISTINCT FROM a.tenant_id;
SELECT count(*) AS cross_tenant_prompt_pods FROM public.prompt_evolution_logs l
 JOIN public.agent_configs a ON l.pod_id=a.id
 WHERE l.tenant_id IS DISTINCT FROM a.tenant_id;
```

If tables are not yet present, inventory first and skip unavailable queries.
**STOP** if data custody, existing tenant associations or ownership are unknown.

## Step 2 — controlled migration review (not executed here)

Review the exact contents and order before writing:

1. `20261024000001_multi_tenant_schema.sql` — baseline tables/policies
2. `20261105000001_trusted_tenant_claim.sql` — app_metadata claim only
3. `20261108000001_audit_rls_and_tenant_pod_fks.sql` — audit RLS, three
   composite tenant/pod references marked `NOT VALID` for historical rows
4. `20261108000002_private_staff_memberships.sql` — private staff grants,
   current-member RLS resolver, restrictive direct-Data-API write policies

Run inside a reviewed staging migration process with audit log and a tested
recovery snapshot. **Do not validate NOT VALID constraints** until existing
cross-tenant records are inspected and remediation approved. There are no
automatic scripts in this PR that mutate a connected Supabase project.

## Step 3 — post-migration read-only preflight

`scripts/staging_readonly_preflight.py` runs SQL with a **READ ONLY**
transaction, 15-second statement timeout and 3-second lock timeout. It returns
aggregate counts and a deterministic **HOLD** or **LOCAL_SQL_PREFLIGHT_CLEAR**.
It cannot certify a real identity provider, hosted PostgREST behavior,
successful backup restore, or production permission to release.

Accepted invocation in a **separate approved staging runner** (never a desktop
clipboard or public CI logs):

```sh
export HRGEN_PREFLIGHT_APPROVED_SCOPE=private-staging-readonly
# Inject HRGEN_STAGING_READONLY_DATABASE_URL from a private secret manager.
python scripts/staging_readonly_preflight.py
```

A nonzero exit status means **HOLD**. Never bypass it. Keep the connection URI
out of GitHub Actions artifacts and command output.

## Step 4 — real provider E2E, only when connected

- Provision synthetic Lab A/B and staff owner/admin/sales/viewer accounts.
  Trusted provisioning must set both `app_metadata` and
  `staff_memberships` consistently. No self-service staff grant editing.
- Prove with **real Supabase-issued signed JWTs**: two-tenant SELECT
  isolation; viewer direct Data API INSERT/UPDATE/DELETE blocked; role-based
  CRM writes only for the same tenant; no audit-log direct writes.
- Disable a staff account, demote its role, and transfer a synthetic account
  to a different tenant. Verify the previously issued JWT immediately fails
  both Express staff API and direct PostgREST access.
- Verify bad signature, expired session, secret-key custody, key rotation,
  HTTPS/JWKS issuer, loss of membership provider (503 fail-closed), denial
  logging without personal transcripts, and browser state clearing.
- Document real browser desktop/mobile runs and independent QA evidence.

## Step 5 — rollout decision and recovery

**GO requires:** reviewed staging migration, verified backup and restore
checkpoint, no unscoped/cross-tenant historical data, all new policies and
constraints approved, genuine signed JWT E2E, valid rollback plan, security/
quality reviewers, and founder's explicit production authorization.

**NO-GO:** any unknown tenant association; failed RLS/grants; private key in
client bundle; provider-signed webhook checks incomplete; no tenant test
records; no restore evidence; or unapproved deployment.

Rollback is a **reviewed operator decision**, not a blind down-migration:
preserve deny-by-default access while reverting application traffic, inspect
migration side effects, and use an approved snapshot/repair procedure only
with DBA and founder sign-off. Never drop RLS or publish private memberships
to restore features.

## Current evidence register

| Check | Current result |
|---|---|
| Four migrations in isolated PostgreSQL 16 | CI PASS |
| Direct Data API equivalent SQL RLS, private membership grants | CI PASS |
| Synthetic Express / browser / voice regressions | CI PASS |
| Read-only HOLD vs local SQL clear preflight | CI PASS |
| Actual connected Supabase staging Auth/PostgREST | NOT TESTED |
| Production database backup/migration/rollback | NOT TESTED |
| Live HRGen.in / Cloudflare / payments / calling | UNCHANGED / HOLD |
