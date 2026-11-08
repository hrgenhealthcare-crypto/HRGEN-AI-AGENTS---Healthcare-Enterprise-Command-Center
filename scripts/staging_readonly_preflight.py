"""Read-only post-migration Supabase staging SQL safety preflight.

No customer identities, transcripts, emails, phones or row-level details are
printed. The report contains aggregate counts and policy/constraint flags only.

This does NOT prove Supabase Auth, real PostgREST grants, or a production rollout.
Apply only to an explicitly approved private staging database after migration
review. It performs NO cleanup/DDL/DML.
"""
from __future__ import annotations

import json
from typing import Any


CRITICAL_TABLES = (
    "tenants", "agent_configs", "leads_crm", "agent_performance_logs",
    "prompt_evolution_logs", "llm_fallback_audit_logs", "staff_memberships",
)
TENANT_FKS = (
    "fk_leads_crm_tenant_assigned_pod",
    "fk_agent_performance_tenant_pod",
    "fk_prompt_evolution_tenant_pod",
)


def collect_preflight(cursor: Any) -> dict[str, Any]:
    """Run only SELECT against PostgreSQL catalogs and tenant-data aggregates."""
    cursor.execute("""
      SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
       WHERE relnamespace = 'public'::regnamespace
         AND relname = ANY(%s)
    """, (list(CRITICAL_TABLES),))
    tables = {str(name): (bool(rls), bool(forced))
              for name, rls, forced in cursor.fetchall()}
    missing = sorted(set(CRITICAL_TABLES) - set(tables))
    rls_missing = sorted(name for name in CRITICAL_TABLES
                         if name not in tables or not tables[name][0])
    forced_membership = tables.get("staff_memberships") == (True, True)

    cursor.execute("""
      SELECT conname, convalidated
        FROM pg_constraint
       WHERE conname = ANY(%s)
    """, (list(TENANT_FKS),))
    fk_rows = {str(name): bool(valid) for name, valid in cursor.fetchall()}
    unvalidated = sorted(name for name in TENANT_FKS
                         if fk_rows.get(name) is not True)

    # Preflight runs after staging migration and only when tables exist.
    # A failed query must not silently be interpreted as an all-clear.
    counts = {}
    if not missing:
        queries = {
            "unscoped_llm_audit": """
               SELECT count(*) FROM public.llm_fallback_audit_logs
                WHERE tenant_id IS NULL
            """,
            "mismatched_lead_pods": """
               SELECT count(*) FROM public.leads_crm l
               JOIN public.agent_configs a ON l.assigned_pod_id = a.id
               WHERE l.tenant_id IS DISTINCT FROM a.tenant_id
            """,
            "mismatched_performance_pods": """
               SELECT count(*) FROM public.agent_performance_logs l
               JOIN public.agent_configs a ON l.pod_id = a.id
               WHERE l.tenant_id IS DISTINCT FROM a.tenant_id
            """,
            "mismatched_prompt_pods": """
               SELECT count(*) FROM public.prompt_evolution_logs l
               JOIN public.agent_configs a ON l.pod_id = a.id
               WHERE l.tenant_id IS DISTINCT FROM a.tenant_id
            """,
        }
        for key, query in queries.items():
            cursor.execute(query)
            counts[key] = int(cursor.fetchone()[0])

    cursor.execute("""
      SELECT tablename, policyname, permissive, cmd, roles
        FROM pg_policies
       WHERE schemaname='public'
         AND policyname LIKE 'staff_write_%'
    """)
    found_policies = {
        (str(table), str(name), str(permissive), str(command).upper(),
         tuple(roles) if roles else ())
        for table, name, permissive, command, roles in cursor.fetchall()
    }
    required_tables = (
        "tenants", "agent_configs", "leads_crm",
        "agent_performance_logs", "prompt_evolution_logs",
        "llm_fallback_audit_logs",
    )
    missing_write_policies = []
    for table in required_tables:
        for op in ("INSERT", "UPDATE", "DELETE"):
            name = f"staff_write_{op.lower()}_{table}"
            expected = (table, name, "RESTRICTIVE", op, ("authenticated",))
            if expected not in found_policies:
                missing_write_policies.append(name)

    # Check direct grants, never query any real membership row details.
    grants: dict[str, bool] = {}
    for role in ("anon", "authenticated", "service_role"):
        for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
            cursor.execute(
                "SELECT has_table_privilege(%s, 'public.staff_memberships', %s)"
                if "staff_memberships" not in missing else "SELECT false",
                (role, privilege) if "staff_memberships" not in missing else (),
            )
            grants[f"{role}_{privilege.lower()}"] = bool(cursor.fetchone()[0])
    expected_grants = (
        all(not grants[f"{role}_{priv.lower()}"]
            for role in ("anon", "authenticated")
            for priv in ("SELECT", "INSERT", "UPDATE", "DELETE"))
        and grants["service_role_select"]
        and all(not grants[f"service_role_{priv}"]
                for priv in ("insert", "update", "delete"))
    )
    cursor.execute("""
      SELECT pg_get_functiondef(to_regprocedure('public.current_tenant_id()'))
    """)
    result = cursor.fetchone()
    func = str(result[0] or "") if result else ""
    trusted_resolver = (
        "staff_memberships" in func
        and "app_metadata" in func
        and "user_metadata" not in func
        and "SECURITY DEFINER" in func
    )

    blockers = []
    if missing: blockers.append("missing_required_tables")
    if rls_missing or not forced_membership: blockers.append("rls_not_enforced")
    if unvalidated: blockers.append("unvalidated_tenant_pod_constraints")
    if any(value > 0 for value in counts.values()): blockers.append("historic_tenant_data_cleanup")
    if missing_write_policies: blockers.append("missing_direct_data_api_write_policies")
    if not expected_grants: blockers.append("membership_privilege_mismatch")
    if not trusted_resolver: blockers.append("staff_claim_resolver_mismatch")

    return {
        "status": "HOLD" if blockers else "LOCAL_SQL_PREFLIGHT_CLEAR",
        "blockers": blockers,
        "missing_tables": missing,
        "rls_missing": rls_missing,
        "membership_rls_forced": forced_membership,
        "unvalidated_constraints": unvalidated,
        "aggregate_data_counts": counts,
        "direct_write_policy_count": len(found_policies),
        "missing_direct_write_policies": sorted(missing_write_policies),
        "membership_grants_expected": expected_grants,
        "current_tenant_resolver_authoritative": trusted_resolver,
        "environment_verified": False,
        "release_approved": False,
    }


def run_readonly(connection: Any) -> dict[str, Any]:
    # Explicit READ ONLY transaction; even if a future edit accidentally adds
    # a write query, PostgreSQL will reject it.
    with connection.cursor() as cursor:
        cursor.execute("BEGIN TRANSACTION READ ONLY")
        try:
            # Bounded read-only SQL review must not hang a shared staging DB.
            cursor.execute("SET LOCAL statement_timeout = '15s'")
            cursor.execute("SET LOCAL lock_timeout = '3s'")
            result = collect_preflight(cursor)
        finally:
            cursor.execute("ROLLBACK")
    return result


if __name__ == "__main__":
    import os
    import psycopg

    # Explicit staging approval required; never take a production URI silently.
    if os.getenv("HRGEN_PREFLIGHT_APPROVED_SCOPE") != "private-staging-readonly":
        raise SystemExit("HOLD: private staging read-only approval is missing")
    dburl = os.getenv("HRGEN_STAGING_READONLY_DATABASE_URL")
    if not dburl:
        raise SystemExit("HOLD: read-only staging database connection unavailable")
    with psycopg.connect(dburl, autocommit=True, connect_timeout=8) as db:
        report = run_readonly(db)
    print(json.dumps(report, sort_keys=True))
    # 2 signifies a blocked gate; never report deploy-ready from SQL alone.
    raise SystemExit(0 if report["status"] == "LOCAL_SQL_PREFLIGHT_CLEAR" else 2)
