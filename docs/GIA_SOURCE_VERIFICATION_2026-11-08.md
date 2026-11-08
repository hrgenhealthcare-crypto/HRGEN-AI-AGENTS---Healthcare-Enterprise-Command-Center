# HRGen GIA Source Verification / Controlled Integration Gate
**Evidence date:** 2026-11-08 (Asia/Kolkata)  
**Status:** OFFLINE SNAPSHOT VERIFIED / LIVE GIA AND HOSTED STAGING HOLD  
**Purpose:** Preserve the existing GIA/GINI engine; never replace it with an unverified UI or historical GitHub command-center fork.

## Archive provenance (connected Drive, read-only acquisition)
| Artifact | Drive modified | SHA-256 (raw ZIP) | Test scope |
|---|---|---|---|
| GIA-PC-v1.2-WINDOWS-CONTROL-TESTED.zip | 2026-08-11 | `e7898c12d9786e4dbf516dfb14685e1690630c17c8bce0375e5756ba671bcfdf` | 288 archive entries, 14 isolated Python tests |
| HRGEN_ALL_AI_AGENTS_STANDALONE_AUDITED_V1.zip | 2026-08-13 | `e017ceb1fac91eb7a701151bf8d250ac3f57f2e8f8934f2f324ed6ad7ef55110` | 12 unique agent IDs; JSON duplicate-key review |

No ZIP content, private Drive URLs, activity logs, patient data or credentials are placed in this repo. The offline Python tests used a temporary copy; original Drive and ZIP remained unchanged.

### Offline GIA-PC v1.2 tests (14/14 PASS)
`test_ai_adapter.py`, `test_ai_router.py`, `test_approval.py`, `test_atomic_changeset.py`, `test_dashboard.py`, `test_quarantine.py`, `test_reconcile_update.py`, `test_release_lifecycle.py`, `test_release_preview.py`, `test_safe_executor.py`, `test_smoke.py`, `test_task_bridge.py`, `test_update_rollback.py`, `test_windows_control.py`.

The archived Windows-control test asserts GUI control and arbitrary PowerShell execution **disabled**; it does not establish real machine automation capabilities or the user's present computer state.

### Archived CEO/PM (identity only)
Archive includes separate `ceo/agent.json` and `pm/agent.json`, each with distinct IDs and roles. Full 12-agent JSON contains no duplicate object keys. The archive's own manifest explicitly marks real LLM/tool expert performance as **NOT CERTIFIED**.

**This does not prove the current November `server/agents/registry.js` boot, independent runtime permissions, provider API keys or running GIA engine.**

## Release-gate sequence (strict)
1. **Source identification:** locate the current authorized GIA repository or machine snapshot, record hash/commit and process version. Do not assume August ZIP is deployed.
2. **PC read-only proof:** authorized desktop execution reads actual folders, running processes, settings and test logs; no files are overwritten.
3. **Current registry proof:** run 12-agent boot, CEO/PM duplicate-key checks and separate-permission negative tests against the actual current source.
4. **Bridge contract:** define a strictly scoped, authenticated, read-only health/version endpoint; allowlist transport, protect secrets server-side and verify private network reachability. No arbitrary PC command execution from customer browser.
5. **Private Supabase staging:** use an independently approved staging project, read-only baseline and restore checkpoint before any migration. Run synthetic signed staff JWT A/B and revocation checks; record tenant isolation and role proof.
6. **Production:** HOLD until all security gates, DSD/HRGen launch-safe catalogue, commercial agreement, payment/WhatsApp consent and founder authorization are documented.

## Design intent
The Workflow Twin's GIA Readiness panel shows only immutable, non-sensitive offline evidence and explicit HOLD states. Its JSON export is a draft evidence record, **not** an ISO/DPDP certificate, legal assurance, hosted acceptance, signed audit or production authorization.

## Explicitly not done
- No live Windows PC access or running GIA inspection from this ChatGPT session.
- No connected Supabase staging credentials, migrations or hosted tenant tests.
- No GIA API/webhook activation, deployment or changes to `hrgen.in`.
- No invented clinical/commercial claims, client demo URLs or automation execution.

**Smallest closure action:** obtain an authorized current GIA source snapshot and record its SHA, then run the same tests against that actual current version before any bridge activation.
